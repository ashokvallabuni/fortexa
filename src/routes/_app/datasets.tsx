import { createFileRoute } from '@tanstack/react-router';
import { DatasetsPage } from '@/pages/DatasetsPage';

export const Route = createFileRoute('/_app/datasets')({ component: DatasetsPage });
