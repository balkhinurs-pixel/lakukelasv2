-- Classroom Zephyr Database Schema
-- Version 1.0

-- 1. Enable RLS
-- 2. Create Policies

-- ==== EXTENSIONS ====
-- Enable UUID generation
create extension if not exists "uuid-ossp" with schema extensions;


-- ==== TABLES ====

-- Users Table: Stores user authentication info. Handled by Supabase Auth.
-- We will have a "profiles" table to store public user data.

-- Profiles Table: Stores public-facing user data.
create table if not exists profiles (
    id uuid not null primary key, -- Foreign key to auth.users.id
    email varchar(255) unique,
    full_name text,
    avatar_url text,
    is_admin boolean default false,
    -- Teacher-specific profile data
    nip varchar(50),
    rank_group varchar(100), -- Pangkat/Golongan
    position varchar(100), -- Jabatan
    -- Foreign key to auth.users table
    constraint fk_user foreign key (id) references auth.users (id) on delete cascade
);
-- Comment on table and columns
comment on table profiles is 'Stores public user data, extending the auth.users table.';
comment on column profiles.id is 'Links to the corresponding user in Supabase''s auth.users table.';
comment on column profiles.is_admin is 'Whether the user has administrative privileges.';


-- School Info Table: Stores school data for reports.
create table if not exists school_info (
    id uuid not null primary key default uuid_generate_v4(),
    teacher_id uuid not null references profiles(id) on delete cascade,
    school_name text,
    school_address text,
    school_logo_url text,
    headmaster_name text,
    headmaster_nip varchar(50),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(teacher_id) -- Each teacher has one school info entry
);
comment on table school_info is 'Stores school-specific information for a teacher, used in report headers.';


-- Classes Table: Stores class groups.
create table if not exists classes (
    id uuid not null primary key default uuid_generate_v4(),
    teacher_id uuid not null references profiles(id) on delete cascade,
    name varchar(100) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table classes is 'Represents a class or group of students taught by a teacher.';


-- Subjects Table: Stores subjects taught by a teacher.
create table if not exists subjects (
    id uuid not null primary key default uuid_generate_v4(),
    teacher_id uuid not null references profiles(id) on delete cascade,
    name varchar(100) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table subjects is 'Represents a subject taught by a teacher.';


-- Students Table: Stores student data.
create table if not exists students (
    id uuid not null primary key default uuid_generate_v4(),
    teacher_id uuid not null references profiles(id) on delete cascade,
    class_id uuid not null references classes(id) on delete cascade,
    full_name text not null,
    nis varchar(50),
    nisn varchar(50) unique,
    gender varchar(20),
    status varchar(20) default 'active' not null, -- e.g., active, graduated, moved
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table students is 'Stores individual student data, linked to a class.';
comment on column students.status is 'The current status of the student (e.g., active, graduated).';


-- Schedule Table: Stores weekly teaching schedule.
create table if not exists schedule (
    id uuid not null primary key default uuid_generate_v4(),
    teacher_id uuid not null references profiles(id) on delete cascade,
    subject_id uuid not null references subjects(id) on delete cascade,
    class_id uuid not null references classes(id) on delete cascade,
    day_of_week smallint not null, -- 0=Sunday, 1=Monday, ...
    start_time time not null,
    end_time time not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint check_day_of_week check (day_of_week between 0 and 6)
);
comment on table schedule is 'Stores the teacher''s weekly teaching schedule.';
comment on column schedule.day_of_week is 'Day of the week, where 1 is Monday and 7 is Sunday.';


-- Attendance History Table: Stores attendance records for each meeting.
create table if not exists attendance_history (
    id uuid not null primary key default uuid_generate_v4(),
    teacher_id uuid not null references profiles(id) on delete cascade,
    class_id uuid not null references classes(id) on delete cascade,
    subject_id uuid not null references subjects(id) on delete cascade,
    date date not null,
    meeting_number int,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table attendance_history is 'Header table for a single attendance event.';


-- Attendance Records Table: Stores status for each student in an attendance event.
create table if not exists attendance_records (
    id uuid not null primary key default uuid_generate_v4(),
    attendance_history_id uuid not null references attendance_history(id) on delete cascade,
    student_id uuid not null references students(id) on delete cascade,
    status varchar(20) not null, -- Hadir, Sakit, Izin, Alpha
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(attendance_history_id, student_id)
);
comment on table attendance_records is 'Stores the specific attendance status for each student for a given meeting.';


-- Grade History Table: Stores grade records for each assessment.
create table if not exists grade_history (
    id uuid not null primary key default uuid_generate_v4(),
    teacher_id uuid not null references profiles(id) on delete cascade,
    class_id uuid not null references classes(id) on delete cascade,
    subject_id uuid not null references subjects(id) on delete cascade,
    date date not null,
    assessment_type text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table grade_history is 'Header table for a single grading event/assessment.';


-- Grade Records Table: Stores score for each student in a grading event.
create table if not exists grade_records (
    id uuid not null primary key default uuid_generate_v4(),
    grade_history_id uuid not null references grade_history(id) on delete cascade,
    student_id uuid not null references students(id) on delete cascade,
    score numeric(5, 2), -- Allows for decimal scores, e.g., 85.50
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(grade_history_id, student_id)
);
comment on table grade_records is 'Stores the specific score for each student for a given assessment.';


-- Journal Entries Table: Stores teaching journals.
create table if not exists journal_entries (
    id uuid not null primary key default uuid_generate_v4(),
    teacher_id uuid not null references profiles(id) on delete cascade,
    class_id uuid not null references classes(id) on delete cascade,
    subject_id uuid not null references subjects(id) on delete cascade,
    date date not null,
    meeting_number int,
    learning_objectives text not null,
    learning_activities text not null,
    assessment text,
    reflection text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table journal_entries is 'Stores the teacher''s reflective teaching journals.';


-- Subscriptions Table: Manages user subscriptions.
create table if not exists subscriptions (
    id uuid not null primary key references profiles(id) on delete cascade,
    plan_name varchar(50) not null, -- e.g., 'Free', 'Semester', 'Tahunan'
    status varchar(50) not null, -- e.g., 'active', 'canceled', 'expired'
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table subscriptions is 'Manages user subscription status and plan.';


-- Coupons Table: Stores discount coupons.
create table if not exists coupons (
    id uuid not null primary key default uuid_generate_v4(),
    code varchar(50) unique not null,
    type varchar(20) not null, -- 'Persen' or 'Tetap'
    value numeric not null,
    usage_limit int,
    times_used int default 0,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table coupons is 'Stores discount coupons for promotions.';


-- Payment Transactions Table: Logs payment gateway transactions.
create table if not exists payment_transactions (
    id uuid not null primary key default uuid_generate_v4(),
    user_id uuid not null references profiles(id) on delete cascade,
    reference_id varchar(100) unique not null,
    amount int not null,
    product_details text,
    status varchar(50) default 'pending', -- pending, success, failed
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
comment on table payment_transactions is 'Logs transactions from the payment gateway.';


-- ==== RLSP (Row-Level Security) POLICIES ====
-- This is a basic setup. Review and enhance security policies based on your app's specific needs.

-- PROFILES
alter table profiles enable row level security;
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
-- Note: Admin access policies would be more complex, often involving a function to check admin role.

-- SCHOOL_INFO
alter table school_info enable row level security;
create policy "Users can view and manage their own school info" on school_info for all using (auth.uid() = teacher_id);

-- CLASSES
alter table classes enable row level security;
create policy "Users can view and manage their own classes" on classes for all using (auth.uid() = teacher_id);

-- SUBJECTS
alter table subjects enable row level security;
create policy "Users can view and manage their own subjects" on subjects for all using (auth.uid() = teacher_id);

-- STUDENTS
alter table students enable row level security;
create policy "Users can view and manage their own students" on students for all using (auth.uid() = teacher_id);

-- SCHEDULE
alter table schedule enable row level security;
create policy "Users can view and manage their own schedule" on schedule for all using (auth.uid() = teacher_id);

-- ATTENDANCE
alter table attendance_history enable row level security;
create policy "Users can view and manage their own attendance history" on attendance_history for all using (auth.uid() = teacher_id);
alter table attendance_records enable row level security;
-- Policy for records table should probably reference the header table's ownership.
create policy "Users can access records linked to their attendance history" on attendance_records for all
    using (exists (select 1 from attendance_history where id = attendance_history_id and auth.uid() = teacher_id));

-- GRADES
alter table grade_history enable row level security;
create policy "Users can view and manage their own grade history" on grade_history for all using (auth.uid() = teacher_id);
alter table grade_records enable row level security;
create policy "Users can access records linked to their grade history" on grade_records for all
    using (exists (select 1 from grade_history where id = grade_history_id and auth.uid() = teacher_id));

-- JOURNALS
alter table journal_entries enable row level security;
create policy "Users can view and manage their own journals" on journal_entries for all using (auth.uid() = teacher_id);

-- SUBSCRIPTIONS
alter table subscriptions enable row level security;
create policy "Users can view their own subscription" on subscriptions for select using (auth.uid() = id);
-- Note: Updates to subscriptions should likely be handled by secure server-side logic (e.g., Edge Functions) after a successful payment.

-- COUPONS & TRANSACTIONS
-- These tables are typically managed by admins or server-side logic, so public policies might not be needed.
-- Or they could be read-only for users in specific contexts.

-- Example for a public-read coupon:
-- alter table coupons enable row level security;
-- create policy "Allow public read access to active coupons" on coupons for select using (is_active = true);
