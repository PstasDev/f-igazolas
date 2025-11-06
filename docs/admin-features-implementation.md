# Future Features Implementation Plan

**Project**: f-igazolas Advanced Administration Tools, Analytics, and new tools
**Initial plan**: 2025-11-06  
**Status**: Planning Phase

---

## Selected Features for Implementation

### 1. Password Management ✅ SELECTED
- [ ] Generate strong random password for selected user either by:
    - [ ] Automatically send new strong password via email
    - [ ] Generate but display in modal (one-time view, user select all, monospace, copy button, no email)

**Required Backend Endpoints:**
- `POST /api/admin/users/{user_id}/generate-password`
  - Query param: `send_email=true/false`
  - Response: `{ password?: string, message: string, email_sent: boolean }`
  - Permission required: `superuser`
- `POST /api/admin/users/{user_id}/reset-password`
  - Body: `{ new_password: string, send_email: boolean }`
  - Permission required: `superuser`

---

### 2. Real-time Overview of All Classes ✅ SELECTED
- [ ] GitHub commit graph inspired visualization
    - [ ] Multiple creative visualization variants
    - [ ] Color-coded squares showing activity/stats
    - [ ] Interactive tooltips with detailed data

**Required Backend Endpoints:**
- `GET /api/admin/classes/activity-heatmap`
  - Query params: `from_date`, `to_date`, `metric_type` (submissions, approvals, logins, etc.)
  - Response: `{ dates: [], classes: [{ id, name, data: [{ date, value, intensity }] }] }`
  - Permission required: `superuser`
- `GET /api/admin/classes/overview-stats`
  - Response: `{ classes: [{ id, name, total_students, active_students, pending_count, approval_rate, last_activity }] }`
  - Permission required: `superuser`

---

### 3. Assign/Remove Teachers to Classes ✅ SELECTED
- [ ] Multiple teachers per class support
- [ ] Special handling for "osztalyfonok" test user (move)
- [ ] Easy class switching for test user
- [ ] Bulk assignment interface

**Required Backend Endpoints:**
- `POST /api/admin/classes/{class_id}/assign-teacher`
  - Body: `{ teacher_id: number }`
  - Permission required: `superuser`
- `DELETE /api/admin/classes/{class_id}/remove-teacher/{teacher_id}`
  - Permission required: `superuser`
- `POST /api/admin/users/osztalyfonok/move-to-class`
  - Body: `{ class_id: number }`
  - Permission required: `superuser`
- `GET /api/admin/classes/{class_id}/teachers`
  - Response: `{ teachers: [{ id, username, name, is_superuser, assigned_date }] }`
  - Permission required: `superuser`

---

### 4. Student Login Statistics ✅ SELECTED
- [ ] Per-class login stats table
- [ ] Logged in ever vs never logged in counts
- [ ] Summary statistics across all classes
- [ ] Last login timestamps

**Required Backend Endpoints:**
- `GET /api/admin/students/login-stats`
  - Response: `{ summary: { total, logged_in, never_logged_in }, per_class: [{ class_id, class_name, total, logged_in, never_logged_in, students: [{ id, name, last_login?, login_count }] }] }`
  - Permission required: `superuser`

---

### 5. Teacher Workload Dashboard ✅ SELECTED
- [ ] Number of students per teacher
- [ ] Pending reviews count
- [ ] Workload distribution visualization

**Required Backend Endpoints:**
- `GET /api/admin/teachers/workload`
  - Response: `{ teachers: [{ id, name, classes: [], total_students, pending_count, approved_today, rejected_today, avg_response_time_hours }] }`
  - Permission required: `superuser`

**Required Database/Logic Changes:**
- Teacher last response's timestamp should be recorded to the igazolás record for response time calculation

---

### 6. Teacher Permissions Management ✅ SELECTED
- [ ] Promote to superuser
- [ ] Demote from superuser
- [ ] Permission change logging
- [ ] Confirmation dialogs for safety

**Required Backend Endpoints:**
- `POST /api/admin/users/{user_id}/promote-superuser`
    - Permission required: `superuser`
- `POST /api/admin/users/{user_id}/demote-superuser`
  - Permission required: `superuser`
- `GET /api/admin/users/{user_id}/permissions`
  - Response: `{ user_id, username, is_superuser, is_staff, permissions: [], change_history: [] }`
    - Permission required: `superuser`

---

### 7. Teacher Activity Monitoring ✅ SELECTED
- [ ] Last login
- [ ] Actions performed in time period (approvals, rejections, comments)
- [ ] Activity timeline visualization, based on igazolás model>last teacher response timestamp

**Required Backend Endpoints:**
- `GET /api/admin/teachers/{teacher_id}/activity`
  - Query params: `from_date`, `to_date`
  - Response: `{ user, login_count, total_actions, actions_breakdown: { approved, rejected, commented }, activity_timeline: [{ date, action_type, count }] }`
    - Permission required: `superuser`

---

### 8. Multiple Class Support for Teachers ✅ SELECTED
- [ ] One teacher assigned to multiple classes
- [ ] Temporary delegation support
- [ ] Osztályfőnök helyettes role
    - The osztályfőnöks (and superusers) should be able to select the permissions for their own Osztályfőnök helyettes teachers:
        - View-only
        - Full response rights
        - Control over allowed igazolás types

**Required Backend Endpoints:**
- `POST /api/admin/teachers/{teacher_id}/assign-classes`
  - Body: `{ class_ids: number[], is_primary: boolean, delegation_end_date?: string }`
- `GET /api/admin/teachers/{teacher_id}/classes`
  - Response: `{ classes: [{ id, name, is_primary, assigned_date, delegation_end_date? }] }`

**Required Database/Logic Changes:**
- Multiple large modifications required, to be determined by backend team

---

### 9. New Academic Year Bulk Assignment ✅ SELECTED
- [ ] Create new class
- [ ] Bulk user import via email
- [ ] Auto-generate strong passwords
- [ ] Export credentials list (CSV/PDF)
- [ ] Assign teacher to new class

**Required Backend Endpoints:**
- `POST /api/admin/academic-year/create-class`
  - Body: `{ name, tagozat, kezdes_eve, teacher_email, student_emails: [] }`
  - Response: `{ class_id, created_students: [{ id, email, username, password }], teacher_assigned }`
  - Permission required: `superuser`
- `POST /api/admin/bulk/create-students-with-passwords`
  - Body: `{ emails: [], class_id }`
  - Response: `{ created: [{ id, email, username, password, first_login_url }], failed: [] }`
  - Permission required: `superuser`

---

### 10. Database Statistics ✅ SELECTED
- [ ] Total records per table
- [ ] Growth rate (daily, weekly, monthly)
- [ ] Database size
- [ ] Record creation trends

**Required Backend Endpoints:**
- `GET /api/admin/system/database-stats`
  - Response: `{ total_users, total_classes, total_igazolasok, total_mulasztasok, growth_rate: { daily, weekly, monthly }, db_size_mb, largest_tables: [] }`
  - Permission required: `superuser`

---

### 11. API Performance Metrics ✅ SELECTED
- [ ] Average response time per endpoint
- [ ] Request count per endpoint
- [ ] Slowest endpoints
- [ ] Error rate tracking

**Required Backend Endpoints:**
- `GET /api/admin/system/api-metrics`
  - Query params: `from_date`, `to_date`
  - Response: `{ endpoints: [{ path, method, avg_response_ms, request_count, error_count, p95_response_ms }], slowest_endpoints: [], most_used: [] }`
  - Permission required: `superuser`
- `POST /api/admin/system/api-metrics/refresh`
  - Uploads latest metrics from meter system
  - Response: `{ message }`
  - Permission required: `superuser`

**Required Database:**
- New table: `APIMetrics` (JSONFields)

The data can be populated via a trigger on the frontend that runs a lot of tests and then posts the results to the jsonfields. These should be only manually triggered by an admin action to avoid performance overhead.

---

### 12. Storage Usage Monitoring ✅ SELECTED
- [ ] Total storage used
- [ ] Storage per resource type (images, documents)
- [ ] Largest files
- [ ] Storage trends

**Required Backend Endpoints:**
- `GET /api/admin/system/storage-stats`
  - Response: `{ total_mb, images_mb, documents_mb, other_mb, largest_files: [{ name, size_mb, type, uploaded_date }], trend: [] }`

Should be calculated on demand.


---

### 14. Academic Year Archival System ✅ SELECTED
- [ ] Add `archived` field to relevant models
- [ ] Archive previous academic year
- [ ] View archived data (read-only)
- [ ] Archive wizard with confirmation

**Required Backend Endpoints:**
- `POST /api/admin/academic-year/archive`
  - Body: `{ year_start: number, archive_classes: boolean, archive_igazolasok: boolean }`
  - Response: `{ archived_count: { classes, igazolasok, students }, message }`
  - Permission required: `superuser`
- `GET /api/admin/academic-year/archived`
  - Response: `{ years: [{ year, class_count, student_count, igazolasok_count }] }`
  - Permission required: `superuser`
- `GET /api/admin/academic-year/{year}/data`
  - Response: Full archived data for the year
    - Permission required: `superuser`

**Required Database Changes:**
- Add `archived` boolean field to: `Osztaly`, `Igazolas`, `Profile`
- Add `archive_date` datetime field
- Add `academic_year` field (e.g., "2024/2025")
- Users who leave the school should be deativated but their data retained for archival purposes

---

### 15. Manual Attendance Management ✅ SELECTED
- [ ] Create attendance record manually
- [ ] Edit existing attendance
- [ ] Delete attendance records
- [ ] Link to igazolások

**Required Backend Endpoints:**
- `POST /api/admin/attendance/create`
  - Body: `{ student_id, date, ora, tantargy, tema, tipus, igazolt, igazolas_id? }`
  - Permission required: `superuser`
- `PUT /api/admin/attendance/{id}`
  - Body: Same as create
    - Permission required: `superuser`
- `DELETE /api/admin/attendance/{id}`
    - Permission required: `superuser`
- `GET /api/admin/attendance/student/{student_id}`
  - Query params: `from_date`, `to_date`
    - Response: `{ attendance_records: [] }`
        - Permission required: `superuser`

---

### 19. Maintenance Mode ✅ SELECTED
- [ ] Toggle maintenance mode on/off
- [ ] Custom maintenance message
- [ ] Allow admin access during maintenance
- [ ] Scheduled maintenance

**Required Backend Endpoints:**
- `GET /api/admin/maintenance/status`
  - Response: `{ is_active, message, scheduled_start?, scheduled_end?, allowed_users: [] }`
  - Permission required: `superuser`
- `POST /api/admin/maintenance/toggle`
  - Body: `{ enabled: boolean, message?: string, scheduled_start?, scheduled_end? }`
    - Response: `{ is_active, message }`
    - Permission required: `superuser`

There is already a system message support, but only after auth.

---

### 20. Approval/Rejection Rate Analysis ✅ SELECTED
- [ ] Overall approval rate
- [ ] Per-teacher rates
- [ ] Per-igazolás-type rates
- [ ] Trend over time

**Required Backend Endpoints:**
- `GET /api/admin/analytics/approval-rates`
  - Query params: `from_date`, `to_date`, `group_by` (teacher, type, class)
  - Response: `{ overall_rate, by_teacher: [], by_type: [], by_class: [], trend: [] }`
  - Permission required: `superuser`

---

### 23. User Impersonation Mode ✅ SELECTED
- [ ] Admin can view as any user
- [ ] Clear visual indicator (banner)
- [ ] All actions logged
- [ ] Cannot change passwords while impersonating
- [ ] Easy exit impersonation

**Required Backend Endpoints:**
- `POST /api/admin/impersonate/start`
  - Body: `{ user_id: number }`
  - Response: `{ impersonation_token, user, restrictions: [] }`
- `POST /api/admin/impersonate/stop`
  - Response: `{ message, original_user }`
- `GET /api/admin/impersonate/status`
  - Response: `{ is_impersonating, impersonated_user?, original_user?, started_at }`

**Required Database:**
- New table: `ImpersonationLog` (admin_id, impersonated_user_id, start_time, end_time, actions_performed)

---

## Implementation Progress Tracking

### Phase 1: Core User Management (Week 1-2)
- [ ] Feature 1: Password Management
- [ ] Feature 3: Teacher Assignment
- [ ] Feature 6: Teacher Permissions
- [ ] Feature 4: Student Login Stats

### Phase 2: Analytics & Monitoring (Week 3-4)
- [ ] Feature 2: Class Activity Heatmap
- [ ] Feature 5: Teacher Workload
- [ ] Feature 7: Teacher Activity
- [ ] Feature 13: Response Time Metrics
- [ ] Feature 20: Approval Rate Analysis
- [ ] Feature 21: Workload Distribution
- [ ] Feature 22: Bottleneck Identification

### Phase 3: System Management (Week 5-6)
- [ ] Feature 10: Database Statistics
- [ ] Feature 11: API Performance Metrics
- [ ] Feature 12: Storage Usage
- [ ] Feature 17: Global Settings
- [ ] Feature 18: Feature Flags
- [ ] Feature 19: Maintenance Mode

### Phase 4: Academic Year Tools (Week 7-8)
- [ ] Feature 9: Bulk Assignment Tool
- [ ] Feature 14: Academic Year Archival
- [ ] Feature 8: Multiple Class Support

### Phase 5: Advanced Features (Week 9-10)
- [ ] Feature 15: Manual Attendance
- [ ] Feature 16: Bulk Attendance Corrections
- [ ] Feature 23: User Impersonation

---

## Backend Endpoint Summary

### Total New Endpoints Required: 45+

#### User Management (9 endpoints)
- Password generation/reset: 2
- Teacher assignment: 4
- Permissions: 2
- Impersonation: 3

#### Analytics (8 endpoints)
- Activity heatmap: 2
- Workload/performance: 3
- Approval rates: 1
- Bottlenecks: 1
- Response times: 1

#### System Monitoring (3 endpoints)
- Database stats: 1
- API metrics: 1
- Storage stats: 1

#### Academic Year (5 endpoints)
- Bulk creation: 2
- Archival: 3

#### Attendance (4 endpoints)
- Manual CRUD: 3
- Bulk operations: 2

#### Settings (5 endpoints)
- Global settings: 2
- Feature flags: 2
- Maintenance: 2

#### Class/Student Stats (2 endpoints)
- Login stats: 1
- Class overview: 1

---

## Database Schema Changes Required

### New Tables
1. `FeatureFlag`
2. `ImpersonationLog`
3. `APIMetrics` (optional, can use logging)
4. `SystemSettings` (key-value store)

### Modified Tables
1. `Osztaly` - Add: `archived`, `archive_date`, `academic_year`
2. `Igazolas` - Add: `archived`, `academic_year`
3. `Profile` - Add: `archived`, `last_login`, `login_count`
4. `User` - Add tracking fields if not exists

### New Relationships
- Many-to-many: Teachers to Classes (already exists via `osztalyfonokok`)
- Ensure support for multiple teachers per class

---

## Frontend Components Structure

```
app/dashboard/components/AdminView.tsx (main container)
├── AdminTabs (extended)
│   ├── UserManagementTab
│   │   ├── PasswordManagementSection
│   │   ├── TeacherAssignmentSection
│   │   └── PermissionsManagementSection
│   ├── ClassOverviewTab
│   │   ├── ActivityHeatmap (GitHub-style)
│   │   ├── StudentLoginStatsTable
│   │   └── ClassStatsCards
│   ├── TeacherManagementTab
│   │   ├── WorkloadDashboard
│   │   ├── ActivityMonitor
│   │   └── MultipleClassAssignment
│   ├── AnalyticsTab
│   │   ├── ResponseTimeCharts
│   │   ├── ApprovalRateAnalysis
│   │   ├── WorkloadDistribution
│   │   └── BottleneckIdentification
│   ├── SystemTab
│   │   ├── DatabaseStats
│   │   ├── APIMetrics
│   │   ├── StorageMonitor
│   │   └── MaintenanceMode
│   ├── AcademicYearTab
│   │   ├── BulkAssignmentWizard
│   │   ├── ArchivalInterface
│   │   └── YearTransitionTools
│   ├── AttendanceTab
│   │   ├── ManualAttendanceForm
│   │   └── BulkCorrectionTool
│   └── SettingsTab
│       ├── GlobalSettings
│       ├── FeatureFlags
│       └── ImpersonationControls
```

---

## Notes & Considerations

### Security
- All admin endpoints must verify superuser status
- Impersonation must be heavily logged and restricted
- Password management must use secure generation (cryptographically random)
- Email sending should queue emails, not block requests

### Performance
- Analytics queries should use database views or materialized views
- Consider pagination for large datasets
- Use background tasks for bulk operations

### UX
- All destructive actions need confirmation dialogs
- Loading states for all async operations
- Toast notifications for action feedback
- Export functionality for all data tables

---

## Next Steps

1. Review and approve selected features
2. Prioritize features by business value
3. Create detailed technical specs for Phase 1
4. Set up backend endpoint structure
5. Begin implementation with Password Management (Feature 1)

---

## Non-Admin Features (Student & Teacher Tools)

### 24. Student Mulasztás Import & Comparison ✅ SELECTED
**Description**: Students can export their absence data (Mulasztások) from eKréta and upload to system for comparison with registered Igazolások.

**Workflow**:
1. Student exports Mulasztások from eKréta (CSV/Excel)
2. Upload file to system
3. System parses and creates Mulasztás records
4. System compares with existing Igazolások
5. Display unmatched Mulasztások (missing igazolások)
6. Student can create Igazolás for unmatched items

**Required Backend Endpoints:**
- `POST /api/students/mulasztasok/import`
  - Body: `multipart/form-data` with CSV/Excel file
  - Response: `{ parsed_count, created_count, duplicates_skipped, preview: [] }`
- `POST /api/students/mulasztasok/import-confirm`
  - Body: `{ confirmed_mulasztasok: [] }`
  - Response: `{ created_count, message }`
- `GET /api/students/mulasztasok/unmatched`
  - Response: `{ unmatched: [{ mulasztas, suggested_igazolas_type, date_range }], matched_count, unmatched_count }`

**Required Frontend:**
- File upload component with drag-and-drop
- CSV/Excel parser (use library like `papaparse` or `xlsx`)
- Preview table before confirmation
- Unmatched mulasztások dashboard
- One-click igazolás creation from mulasztás -> opens form pre-filled, with only a few fields to fill

**Database Changes:**
- Ensure `Mulasztas` model can be created by students
- Add `imported_by_student` boolean field
- Add `import_date` datetime field

---

### 25. Stúdiós Support & Group Absences ✅ SELECTED
**Description**: Students in "stúdió" programs can mark other students from their class who were also absent for the same stúdiós activity. More generally, support for group absences (competitions, events, etc.).

**Features**:
- Profile field: `is_studios` boolean
- IgazolasTipus field: `supports_group_absence` boolean
- When creating group-supported igazolás, user can select other students
- System creates linked igazolás records for all selected students
- Original submitter is marked as "group leader"

**Required Backend Endpoints:**
- `GET /api/igazolastipus/group-enabled`
  - Response: `{ types: [{ id, nev, supports_group_absence }] }`
- `POST /api/igazolasok/create-group`
  - Body: `{ ...normal_igazolas_data, additional_student_ids: [] }`
  - Response: `{ created_count, igazolasok: [{ id, profile_id, is_group_leader }] }`
- `GET /api/students/classmates-eligible`
  - Query params: `igazolas_type_id`, `for_studios_only`
  - Response: `{ eligible_students: [{ id, name, is_studios }] }`
- `GET /api/igazolasok/{id}/group-members`
  - Response: `{ group_leader, members: [{ id, profile, status }], group_id }`

**Required Database Changes:**
- `Profile` model:
  - Add `is_studios` boolean field (default: false)
  
- `IgazolasTipus` model:
  - Add `supports_group_absence` boolean field (default: false)
  - Add `requires_studios` boolean field (default: false)
  
- `Igazolas` model:
  - Add `group_id` UUID field (nullable) - links related group igazolások
  - Add `is_group_leader` boolean field (default: false)
  - Add `group_member_count` integer field (default: 1)
  - Add `created_by_group_leader_id` foreign key (nullable) - references who created it

**Required Frontend:**
- Multi-step form extension for group selection
- Classmate selector component (checkboxes/multi-select)
- Filter by `is_studios` when needed
- Group badge display in igazolás list
- Group member list in detail view

---

### 26. Teacher-Created Igazolások ✅ SELECTED
**Description**: Teachers can create igazolás records on behalf of students when another teacher (szaktanár) emails them about absences.

**Criteria**: `diak=false`, `ftv=false`, `korrigalt=false` indicates teacher-created igazolás

**Features**:
- Teacher selects student(s) from their class(es)
- Fill out igazolás form on their behalf
- System marks as teacher-created
- Student receives notification
- Student can view but not edit teacher-created igazolások

**Required Backend Endpoints:**
- `POST /api/teachers/igazolasok/create-for-student`
  - Body: `{ student_id: number, ...igazolas_data }`
  - Response: `{ igazolas, message }`
- `POST /api/teachers/igazolasok/create-bulk`
  - Body: `{ student_ids: [], ...igazolas_data }`
  - Response: `{ created_count, igazolasok: [], failed: [] }`
- `GET /api/teachers/students/eligible-for-igazolas`
  - Response: `{ students: [{ id, name, class, recent_absences }] }`

**Required Frontend:**
- New tab/section in teacher dashboard: "Igazolás létrehozása diáknak"
- Student selector (single or multiple)
- Same igazolás form as student view
- Confirmation dialog with summary
- Bulk creation interface for same event (e.g., entire class at competition)

**Business Rules:**
- Only teachers can create for students in their assigned classes
- Auto-approve teacher-created igazolások or set to pending?
- Student gets notification about teacher-created igazolás
- Clear indicator in UI that teacher created it

---

### 27. Class-Specific Period Configuration ✅ SELECTED
**Description**: Classes can have custom period configurations (e.g., disable 8th period if no one has it).

**Features**:
- Per-class period configuration
- Teachers can enable/disable specific periods
- Affects both student and teacher Órarend components
- Reduces UI clutter for periods that don't exist

**Required Backend Endpoints:**
- `GET /api/classes/{class_id}/period-config`
  - Response: `{ class_id, enabled_periods: [1,2,3,4,5,6,7], disabled_periods: [8,9] }`
- `PUT /api/classes/{class_id}/period-config`
  - Body: `{ enabled_periods: [] }`
  - Response: `{ updated_config, message }`
- `GET /api/classes/{class_id}/period-usage-analysis`
  - Analyzes actual period usage from FTV data
  - Response: `{ periods: [{ ora: number, usage_count, has_lessons: boolean }], recommendations: [] }`

**Required Database Changes:**
- `Osztaly` model:
  - Add `enabled_periods` JSONField (default: [1,2,3,4,5,6,7,8,9])
  - Or new table: `ClassPeriodConfig` with many-to-many relationship

**Required Frontend:**
- Admin/Teacher settings panel for class config
- Toggle switches for each period (1-9)
- Usage analysis helper (shows which periods are actually used)
- Órarend component respects class config
- Warning if disabling period that has scheduled lessons

**Logic:**
- Student sees only their class's enabled periods
- Teacher sees union of all their classes' enabled periods
- Default: all periods enabled
- Smart suggestion: analyze FTV data to recommend periods to disable

---

### 28. Igazolás Type Permission Matrix (Admin View) ✅ SELECTED
**Description**: Admin dashboard showing which classes are allowed to submit which igazolás types in a clear matrix view.

**Features**:
- Matrix table: Classes (rows) × Igazolás Types (columns)
- Visual indicators (✓, ✗, or color-coded cells)
- Quick edit mode: click cell to toggle permission
- Export matrix as CSV/Excel
- Filter by class or type
- Highlights conflicts or unusual permissions

**Required Backend Endpoints:**
- `GET /api/admin/igazolas-types/permission-matrix`
  - Response: `{ classes: [], types: [], matrix: { [class_id]: { [type_id]: boolean } } }`
- `POST /api/admin/igazolas-types/update-permission`
  - Body: `{ class_id, type_id, allowed: boolean }`
  - Response: `{ updated, message }`
- `POST /api/admin/igazolas-types/bulk-update-permissions`
  - Body: `{ updates: [{ class_id, type_id, allowed }] }`
  - Response: `{ updated_count, message }`

**Required Frontend:**
- Large data table with fixed headers
- Color-coded cells (green=allowed, red=blocked)
- Click to toggle permission
- Bulk edit mode (select multiple cells, apply action)
- Export button (CSV/Excel format)
- Search/filter by class or type name
- Summary stats (e.g., "5 classes blocked from Stúdiós Távollét")

**Data Model:**
- Relationship already exists: `IgazolasTipus.nem_fogado_osztalyok`
- Matrix derives from this many-to-many relationship
- Inverse logic: if class in `nem_fogado_osztalyok`, cell is ✗

---

## Implementation Progress - Non-Admin Features

### Phase 6: Student Self-Service (Week 11-12)
- [ ] Feature 24: Mulasztás Import & Comparison

### Phase 7: Collaborative Features (Week 13-14)
- [ ] Feature 25: Stúdiós & Group Absences
- [ ] Feature 26: Teacher-Created Igazolások

### Phase 8: Configuration & Customization (Week 15-16)
- [ ] Feature 27: Class Period Configuration
- [ ] Feature 28: Permission Matrix View

---

## Additional Backend Endpoints Summary (Non-Admin)

### Student Tools (4 endpoints)
- Mulasztás import/preview: 2
- Unmatched mulasztások: 1
- Create igazolás from mulasztás: 1

### Group Absences (4 endpoints)
- Group-enabled types: 1
- Create group igazolás: 1
- Eligible classmates: 1
- Group member list: 1

### Teacher Creation (3 endpoints)
- Create for student: 1
- Bulk create: 1
- Eligible students list: 1

### Class Configuration (3 endpoints)
- Period config CRUD: 2
- Usage analysis: 1

### Permission Matrix (3 endpoints)
- Get matrix: 1
- Update single permission: 1
- Bulk update: 1

**Total Additional Endpoints: 17**

---

## Updated Database Schema Changes

### New Fields

**Profile:**
- `is_studios` (boolean, default=false)

**IgazolasTipus:**
- `supports_group_absence` (boolean, default=false)
- `requires_studios` (boolean, default=false)

**Igazolas:**
- `group_id` (UUID, nullable)
- `is_group_leader` (boolean, default=false)
- `group_member_count` (integer, default=1)
- `created_by_group_leader_id` (FK to Profile, nullable)

**Mulasztas:**
- `imported_by_student` (boolean, default=false)
- `import_date` (datetime, nullable)
- `matched_igazolas_id` (FK to Igazolas, nullable)

**Osztaly:**
- `enabled_periods` (JSONField, default=[1,2,3,4,5,6,7,8,9])

### Indexes to Add
- `Igazolas.group_id` (for efficient group queries)
- `Mulasztas.matched_igazolas_id` (for comparison queries)
- `Profile.is_studios` (for filtering)

---

## Frontend Components Structure (Non-Admin)

```
app/dashboard/student/
├── components/
│   ├── MulasztasImportDialog.tsx
│   ├── MulasztasComparisonView.tsx
│   ├── UnmatchedMulasztasokList.tsx
│   └── MultiStepIgazolasForm.tsx (enhanced)
│       └── GroupSelectionStep.tsx

app/dashboard/teacher/
├── components/
│   ├── CreateIgazolasForStudent.tsx
│   ├── BulkStudentIgazolasForm.tsx
│   └── ClassPeriodConfigPanel.tsx

app/dashboard/components/
├── AdminView.tsx
│   └── IgazolasTypePermissionMatrix.tsx

components/ui/
├── permission-matrix.tsx (new reusable component)
├── file-upload-zone.tsx (for CSV/Excel upload)
└── student-multi-select.tsx (for group selection)
```

---

## Technical Considerations

### File Parsing (Mulasztás Import)
- Support CSV and Excel (XLSX) formats
- Use `papaparse` for CSV
- Use `xlsx` library for Excel
- Validate data structure before import
- Handle Hungarian characters (UTF-8 encoding)
- Map eKréta column names to system fields

### Group Absences Logic
- Use UUID for `group_id` to avoid conflicts
- Transaction: all group members created together or none
- What happens if one student's igazolás is rejected? Cascade or independent?
- Notification: inform all group members when created

### Teacher-Created Igazolások
- Auto-approval policy: admin configurable?
- Email notification to student
- Should student be able to request changes/deletion?
- Audit trail: clearly show who created it

### Period Configuration
- Cache class period configs (high read frequency)
- Validate: can't disable period if active lessons exist
- FTV sync: auto-detect used periods and suggest config
- UI: dynamic Órarend component based on config

### Permission Matrix
- Large matrix: pagination or virtualization
- Optimize query: single query with joins
- Real-time updates or batch save?
- Export: generate CSV server-side for large datasets

---

## User Stories

### US-24: Student Mulasztás Import
```
As a student,
I want to upload my mulasztások from eKréta,
So that I can see which absences don't have igazolások yet
And quickly create missing igazolások.
```

### US-25: Stúdiós Group Absence
```
As a stúdiós student,
When I register my stúdiós absence,
I want to mark which classmates were also absent for the same reason,
So they don't have to create duplicate igazolások.
```

### US-26: Teacher Creates Igazolás
```
As a teacher,
When another teacher emails me about student absences,
I want to create igazolás records on behalf of my students,
So they have proper documentation without manual entry.
```

### US-27: Class Period Configuration
```
As a teacher,
I want to disable unused periods for my class,
So that the schedule UI is cleaner and less confusing.
```

### US-28: Permission Matrix Overview
```
As an admin,
I want to see a matrix of which classes can submit which igazolás types,
So I can quickly understand and modify permissions.
```

---

**Last Updated**: 2025-11-06  
**Document Version**: 2.0  
**Total Features**: 28 (23 Admin + 5 Student/Teacher)  
**Total Backend Endpoints**: 62+
