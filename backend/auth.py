import os
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path="../.env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "super-secret-jwt-token-with-at-least-32-characters-long")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise RuntimeError("Missing Supabase credentials in .env.local")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        # Decode the JWT token offline using the Supabase JWT secret
        # Audience is typically "authenticated"
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

PRIMARY_SUPER_ADMIN_EMAIL = "ashokvallabhuni28@gmail.com"


def is_primary_super_admin(user_payload: dict) -> bool:
    email = (user_payload.get("email") or "").strip().lower()
    return email == PRIMARY_SUPER_ADMIN_EMAIL


def require_super_admin(user_payload: dict = Security(get_current_user)):
    user_id = user_payload.get("sub")

    if is_primary_super_admin(user_payload):
        res = supabase.rpc("can_access_admin", {"_user_id": user_id, "_permission_code": "admin.console"}).execute()
        if res.data is True:
            return user_payload
        raise HTTPException(status_code=403, detail="Super Admin role not provisioned")

    res = supabase.rpc("can_access_admin", {"_user_id": user_id, "_permission_code": "admin.console"}).execute()
    if res.data is True:
        return user_payload

    raise HTTPException(status_code=403, detail="Forbidden: Super Admin required")
