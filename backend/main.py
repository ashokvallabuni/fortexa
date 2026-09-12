from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from auth import supabase, get_current_user, require_super_admin
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

app = FastAPI(title="FORTEXA Access API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AccessRequest(BaseModel):
    full_name: str
    email: str
    requested_role: str
    reason: str

@app.post("/api/v1/access-requests")
def submit_access_request(req: AccessRequest):
    res = supabase.table("access_requests").insert({
        "full_name": req.full_name,
        "email": req.email,
        "requested_role": req.requested_role,
        "reason": req.reason,
        "status": "PENDING"
    }).execute()
    
    if res.data:
        # Audit log (no actor id since unauthenticated)
        supabase.table("audit_logs").insert({
            "action": "ACCESS_REQUEST_CREATED",
            "resource_type": "access_request",
            "resource_id": res.data[0]["id"],
            "detail": {"email": req.email, "role": req.requested_role}
        }).execute()
        return {"success": True, "data": res.data[0]}
    raise HTTPException(status_code=500, detail="Failed to create request")

@app.get("/api/v1/admin/access-requests")
def list_access_requests(user: dict = Depends(require_super_admin)):
    res = supabase.table("access_requests").select("*").eq("status", "PENDING").order("created_at", desc=True).execute()
    return res.data

class ApprovePayload(BaseModel):
    organization_id: str
    role: str

@app.post("/api/v1/admin/access-requests/{request_id}/approve")
def approve_request(request_id: str, payload: ApprovePayload, admin_user: dict = Depends(require_super_admin)):
    req_res = supabase.table("access_requests").select("*").eq("id", request_id).single().execute()
    if not req_res.data or req_res.data.get("status") != "PENDING":
        raise HTTPException(status_code=400, detail="Invalid or already processed request")
    
    request_data = req_res.data
    
    # Create or invite user
    invite_res = supabase.auth.admin.invite_user_by_email(
        request_data["email"],
        {"data": {"full_name": request_data["full_name"]}}
    )
    
    target_user_id = invite_res.user.id if invite_res.user else None
    
    if not target_user_id:
        users_res = supabase.auth.admin.list_users()
        for u in users_res:
            if u.email == request_data["email"]:
                target_user_id = u.id
                break
                
    if not target_user_id:
        raise HTTPException(status_code=500, detail="Failed to find or create user")
        
    # Setup profile, role, and organization
    supabase.table("profiles").upsert({
        "id": target_user_id,
        "email": request_data["email"],
        "display_name": request_data["full_name"]
    }).execute()
    
    supabase.table("user_roles").upsert({
        "user_id": target_user_id,
        "role": payload.role
    }).execute()
    
    supabase.table("organization_memberships").upsert({
        "user_id": target_user_id,
        "organization_id": payload.organization_id,
        "role": payload.role
    }).execute()
    
    # Update request
    supabase.table("access_requests").update({
        "status": "APPROVED",
        "reviewed_by": admin_user["sub"],
        "reviewed_at": datetime.utcnow().isoformat(),
        "organization_id": payload.organization_id,
        "requested_role": payload.role
    }).eq("id", request_id).execute()
    
    # Audit log
    supabase.table("audit_logs").insert({
        "actor_id": admin_user["sub"],
        "action": "ACCESS_REQUEST_APPROVED",
        "resource_type": "user",
        "resource_id": target_user_id,
        "detail": {"email": request_data["email"], "role": payload.role, "organization_id": payload.organization_id}
    }).execute()
    
    return {"success": True, "message": "User approved and invited."}

class RejectPayload(BaseModel):
    reason: Optional[str] = None

@app.post("/api/v1/admin/access-requests/{request_id}/reject")
def reject_request(request_id: str, payload: RejectPayload, admin_user: dict = Depends(require_super_admin)):
    update_res = supabase.table("access_requests").update({
        "status": "REJECTED",
        "reviewed_by": admin_user["sub"],
        "reviewed_at": datetime.utcnow().isoformat(),
        "rejection_reason": payload.reason or "Access denied by administrator."
    }).eq("id", request_id).execute()
    
    if not update_res.data:
        raise HTTPException(status_code=500, detail="Failed to reject request")
        
    # Audit log
    supabase.table("audit_logs").insert({
        "actor_id": admin_user["sub"],
        "action": "REJECT_ACCESS_REQUEST",
        "resource_type": "access_request",
        "resource_id": request_id,
        "detail": {"reason": payload.reason}
    }).execute()
    
    return {"success": True, "message": "Request rejected."}
