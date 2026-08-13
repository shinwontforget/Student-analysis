# Security Policy & Architecture Guidelines

## Overview
This document outlines the mandatory security architecture, secret handling practices, and network isolation policies for the **Academic Survival Simulator** application.

---

## 1. Secret Management & Environment Variables Policy

> [!IMPORTANT]
> **Zero Secrets in Source Control**: Secrets, private keys, database credentials, and API secrets must **NEVER** be hardcoded in code files or committed to Git repositories.

- All secrets and runtime configuration parameters must be supplied strictly through environment variables.
- Production and staging secrets must be injected exclusively via the hosting platform's encrypted secret store (e.g., Vercel Environment Variables, Supabase Secrets, AWS Secrets Manager, GCP Secret Manager, or Railway Environment Variables).
- Standard `.env` files are restricted to local development environments and are explicitly ignored by `.gitignore`.

---

## 2. Sensitivity of `INTERNAL_API_SECRET`

The `INTERNAL_API_SECRET` token secures internal service-to-service communication between the Next.js API routes (`frontend`) and the Python FastAPI backend (`backend`).

- **Sensitivity Standard**: `INTERNAL_API_SECRET` must be treated with the **exact same confidentiality** as `RAZORPAY_KEY_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, and `GEMINI_API_KEY`.
- **Enforcement**: Every request to the internal Python FastAPI analytics routes (`/api/v1/analytics/*`) must include a valid `X-Internal-Secret` HTTP header matching `INTERNAL_API_SECRET`. Requests lacking a valid secret are immediately rejected with HTTP `401 Unauthorized` or `403 Forbidden`.
- **Rotation**: If `INTERNAL_API_SECRET` is compromised, it must be rotated simultaneously across both Next.js and FastAPI environment settings.

---

## 3. Network Isolation for Python FastAPI Backend

> [!WARNING]
> **Strict Public Interface Denial**: The internal Python FastAPI service must **NEVER** be exposed directly to the public Internet or bound to public network interfaces (`0.0.0.0`) in any deployment configuration.

- **Local & Single-Server Deployment**: FastAPI host binding is enforced strictly to `127.0.0.1` (loopback).
- **Container / Cloud Deployment**: In microservice or containerized environments (Docker, Kubernetes, AWS ECS), FastAPI must reside in a private VPC subnet with ingress rules permitting traffic **ONLY** from the Next.js application server security group/IP.
- **No Direct Client Access**: Client browsers never call FastAPI directly; all client traffic routes through Next.js server components or Next.js server-side API routes.

---

## 4. Razorpay Webhook & Payment Security

- **HMAC SHA-256 Verification**: All incoming Razorpay webhook payloads are verified server-side using HMAC SHA-256 signatures generated from `RAZORPAY_KEY_SECRET`.
- **Server-Authoritative Pricing**: Plan pricing and subscription durations are fetched exclusively from `plans.ts` on the server. Client-supplied price/amount parameters are strictly rejected with HTTP `400 Bad Request`.
- **`is_premium` Mutation Protection**: The `is_premium` field in the database can only be modified by service-role admin calls upon verified payment webhooks or admin actions. Public client RLS policies prohibit direct user mutation of `is_premium`.

---

## 5. Pre-Deployment Secret Audit Checklist

Before deploying either service to production, verify the following checklist:

1. [x] Run `git status` and `git log` to confirm no `.env`, `.env.local`, or secret credentials are tracked in Git history.
2. [x] Confirm `RAZORPAY_KEY_SECRET`, `INTERNAL_API_SECRET`, and `SUPABASE_SERVICE_ROLE_KEY` are configured in platform secret managers.
3. [x] Verify FastAPI `host` configuration is set to `127.0.0.1` or restricted VPC internal IP.
4. [x] Run GitHub Actions CI pipeline (`.github/workflows/ci.yml`) to ensure all linting, typechecks, security unit tests, and vulnerability audits (`npm audit`, `pip-audit`) pass cleanly.

---

## Reporting Vulnerabilities
To report security concerns or vulnerabilities, please contact the lead maintainer directly via secure channels.
