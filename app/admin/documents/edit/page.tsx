import { Suspense } from 'react';
import { DocumentEditorPage } from '@/components/admin/document-editor-page';

export default function EditDocumentPage() {
  return (
    <Suspense fallback={<div className="admin-empty"><p>Loading document...</p></div>}>
      <DocumentEditorPage />
    </Suspense>
  );
}
