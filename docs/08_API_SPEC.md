# 08_API_SPEC.md

# 📱 Lemburin — API Specification

---

# Overview

Dokumen ini menjelaskan spesifikasi komunikasi data antara aplikasi **Lemburin Mobile App** dengan backend **Supabase**.

API digunakan untuk:

* Authentication
* User Profile Management
* Employment Management
* Pay Period Management
* Overtime Tracking
* Salary Verification
* Cloud Synchronization

---

# API Architecture

```text
React Native App

        │

        ▼

Supabase Client SDK

        │

        ▼

Supabase Auth

        │

        ▼

PostgreSQL Database

        │

        ▼

Row Level Security
```

---

# Authentication

Authentication menggunakan:

* Supabase Auth
* JWT Token
* Secure Storage pada perangkat

---

# Common Headers

Semua request membutuhkan:

```http
Authorization: Bearer {access_token}

Content-Type: application/json
```

---

# Response Format

## Success

```json
{
  "success": true,
  "data": {}
}
```

---

## Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

---

# Error Codes

| Code          | Description           |
| ------------- | --------------------- |
| AUTH_REQUIRED | User belum login      |
| INVALID_DATA  | Data tidak valid      |
| NOT_FOUND     | Data tidak ditemukan  |
| FORBIDDEN     | Tidak memiliki akses  |
| PERIOD_LOCKED | Periode sudah dikunci |
| SYNC_FAILED   | Sinkronisasi gagal    |

---

# Authentication API

---

# Register

## POST

```text
/auth/v1/signup
```

### Request

```json
{
  "email": "user@email.com",
  "password": "password123"
}
```

### Response

```json
{
  "user": {
    "id": "uuid",
    "email": "user@email.com"
  }
}
```

---

# Login

## POST

```text
/auth/v1/token
```

### Request

```json
{
  "email": "user@email.com",
  "password": "password123"
}
```

### Response

```json
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token"
}
```

---

# Logout

## POST

```text
/auth/v1/logout
```

---

# Profile API

---

# Get Profile

## GET

```text
/profiles/{user_id}
```

### Response

```json
{
  "id": "uuid",
  "full_name": "John Doe",
  "avatar_url": null,
  "timezone": "Asia/Jakarta",
  "currency": "IDR"
}
```

---

# Update Profile

## PATCH

```text
/profiles/{id}
```

### Request

```json
{
  "full_name": "John Doe",
  "timezone": "Asia/Jakarta"
}
```

---

# Employment API

---

# Get Employment List

## GET

```text
/employments
```

### Response

```json
[
  {
    "id": "uuid",
    "company_name": "PT ABC",
    "job_title": "Operator",
    "is_active": true
  }
]
```

---

# Create Employment

## POST

```text
/employments
```

### Request

```json
{
  "company_name": "PT ABC",
  "job_title": "Operator",
  "start_date": "2026-01-01"
}
```

---

# Update Employment

## PATCH

```text
/employments/{id}
```

---

# Pay Period API

---

# Get Pay Period List

## GET

```text
/pay-periods
```

Query:

```text
?employment_id={id}
```

---

# Create Pay Period

## POST

```text
/pay-periods
```

### Request

```json
{
  "employment_id": "uuid",
  "period_name": "Juli 2026",
  "start_date": "2026-06-21",
  "end_date": "2026-07-20",
  "formula_type": "indonesia"
}
```

---

# Get Active Pay Period

## GET

```text
/pay-periods/active
```

---

# Lock Pay Period

## PATCH

```text
/pay-periods/{id}/lock
```

### Response

```json
{
  "is_locked": true
}
```

---

# Overtime API

---

# Get Overtime Entries

## GET

```text
/overtime-entries
```

Query:

```text
?pay_period_id={id}
```

---

# Create Overtime Entry

## POST

```text
/overtime-entries
```

### Request

```json
{
  "pay_period_id": "uuid",
  "work_date": "2026-07-05",
  "start_time": "18:00",
  "end_time": "22:00",
  "break_minutes": 30,
  "notes": "Project deadline"
}
```

---

# Response

```json
{
  "id": "uuid",
  "work_date": "2026-07-05",
  "duration": "3.5 hours"
}
```

---

# Update Overtime Entry

## PATCH

```text
/overtime-entries/{id}
```

---

# Delete Overtime Entry

## DELETE

```text
/overtime-entries/{id}
```

---

# Salary Verification API

---

# Get Verification

## GET

```text
/salary-verifications/{pay_period_id}
```

---

# Create Verification

## POST

```text
/salary-verifications
```

### Request

```json
{
  "pay_period_id": "uuid",
  "slip_amount": 750000,
  "notes": "Slip bulan Juli"
}
```

---

# Update Verification

## PATCH

```text
/salary-verifications/{id}
```

---

# Dashboard API

---

# Get Dashboard Summary

## GET

```text
/dashboard/{pay_period_id}
```

### Response

```json
{
  "total_overtime_days": 5,
  "total_hours": 18,
  "estimated_amount": 850000,
  "verification_status": "pending"
}
```

---

# Calendar API

---

# Get Overtime Calendar

## GET

```text
/calendar
```

Query:

```text
?month=2026-07
```

### Response

```json
[
  {
    "date": "2026-07-05",
    "has_overtime": true
  }
]
```

---

# Synchronization API

---

# Sync Pending Data

## POST

```text
/sync
```

### Request

```json
{
  "changes": [
    {
      "table": "overtime_entries",
      "action": "insert",
      "data": {}
    }
  ]
}
```

---

# Sync Response

```json
{
  "success": true,
  "synced": 5,
  "failed": 0
}
```

---

# Offline Strategy

## Local First Flow

```text
User Input

↓

Local Database

↓

Pending Sync Queue

↓

Internet Available

↓

Supabase Sync

↓

Update Local Status
```

---

# Security Rules

Semua endpoint wajib:

* Memiliki JWT valid.
* Menggunakan Row Level Security.
* Tidak menerima user_id dari client.
* User identity diambil dari token.

---

# API Naming Convention

Menggunakan:

* Lowercase
* Hyphen untuk resource multi-word

Contoh:

```text
/pay-periods

/overtime-entries

/salary-verifications
```

---

# API Versioning

Untuk MVP:

```text
/api/v1
```

Future:

```text
/api/v2
```

---

# Future API Expansion

Kemungkinan endpoint berikut:

```text
/export/pdf

/export/excel

/ocr/slip

/statistics

/notifications

/backup
```

---

# API Summary

| Module         | Endpoint             |
| -------------- | -------------------- |
| Authentication | Auth                 |
| Profile        | profiles             |
| Employment     | employments          |
| Pay Period     | pay-periods          |
| Overtime       | overtime-entries     |
| Verification   | salary-verifications |
| Dashboard      | dashboard            |
| Sync           | sync                 |

---

Dokumen ini menjadi acuan komunikasi antara Mobile Application, Supabase Backend, dan Database Layer.
