-- ============================================================
-- Buddy Blooms Project Tracker — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create table if not exists tasks (
  id            bigint       primary key,
  name          text         not null default '',
  assignee      text         not null default 'Me',
  status        text         not null default 'To Do',
  priority      text         not null default 'Medium (1-3 Weeks)',
  department    text         not null default 'Marketing',
  comments      text                  default '',
  due_date      text                  default '',
  about_project text                  default '',
  action_items  jsonb        not null default '[]',
  sharepoint_url   text              default '',
  sharepoint_label text              default '',
  created_at    text         not null default ''
);

-- Disable Row Level Security for a private internal tool.
-- If you want to add auth later, enable RLS and add policies here.
alter table tasks disable row level security;

-- Allow the anon key full access (since RLS is off this is implied,
-- but explicit grants are good practice).
grant select, insert, update, delete on tasks to anon, authenticated;

-- ============================================================
-- Optional: seed with the starter tasks
-- ============================================================
insert into tasks (id, name, assignee, status, priority, department, comments, due_date, about_project, action_items, sharepoint_url, sharepoint_label, created_at)
values
  (1, 'Buddy Blooms Website Update', 'Cece Rip', 'Done', 'Low (1-10 Days)', 'Design', '', '', 'Add Biggest Buddy to website!',
   '[{"id":1,"text":"Update homepage banner","done":true},{"id":2,"text":"Upload new product photos","done":true}]',
   '', '', '2024-05-01'),
  (2, 'Q3 Marketing Campaign', 'Me', 'In Progress', 'High (ASAP)', 'Marketing', '', '2024-06-30', 'Plan and execute Q3 marketing campaign across all channels.',
   '[{"id":1,"text":"Draft ad copy","done":true},{"id":2,"text":"Design banner assets","done":false},{"id":3,"text":"Set up ad targeting","done":false}]',
   '', '', '2024-05-10'),
  (3, 'Employee Handbook Revision', 'Me', 'To Do', 'Medium (1-3 Weeks)', 'Admin', '', '2024-07-15', 'Update handbook with new HR policies and onboarding procedures.',
   '[{"id":1,"text":"Review current handbook","done":false},{"id":2,"text":"Draft updated sections","done":false}]',
   '', '', '2024-05-15'),
  (4, 'Social Media Content Calendar', 'Cece Rip', 'In Review', 'Medium (1-3 Weeks)', 'Marketing', '', '2024-06-10', 'Build out June and July content calendars for all platforms.',
   '[{"id":1,"text":"Draft post ideas","done":true},{"id":2,"text":"Create graphics","done":true},{"id":3,"text":"Get approval","done":false}]',
   '', '', '2024-05-12')
on conflict (id) do nothing;
