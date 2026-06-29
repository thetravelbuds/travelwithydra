import React from 'react';

const AdminDbSetupNotice: React.FC = () => (
  <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
    <p className="font-semibold">Admin API &amp; database setup</p>
    <ul className="mt-2 list-disc space-y-1 pl-5">
      <li>
        <strong>Local dev:</strong> use <code className="rounded bg-amber-100 px-1">npm run dev</code> (starts
        Vite + Netlify functions). Plain <code className="rounded bg-amber-100 px-1">vite</code> alone cannot
        save promo codes or fees.
      </li>
      <li>
        <strong>Supabase:</strong> run{' '}
        <code className="rounded bg-amber-100 px-1">supabase/ADMIN_SETUP_RUN_IN_SQL_EDITOR.sql</code> in the SQL
        Editor if tables are missing.
      </li>
      <li>
        Ensure <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> is set in{' '}
        <code className="rounded bg-amber-100 px-1">.env.local</code> for local functions.
      </li>
    </ul>
  </div>
);

export default AdminDbSetupNotice;
