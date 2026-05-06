# Secure Authentication Portal

## Overview
This repository contains the source code for a secure authentication system. The application enforces strict access controls, requiring mandatory Multi-Factor Authentication (MFA) prior to granting access to protected resources. 

## System Architecture

The project is divided into three core operational domains:

### 1. Identity & Access (Registration & Login)
Responsible for initial user provisioning and primary credential validation.
*   **Database:** Executes insertions for user profiles and credentials. Verifies username uniqueness.
*   **Backend:** Exposes `/register` and `/login` endpoints. Enforces password security using bcrypt hashing algorithms.
*   **Frontend:** Renders the primary registration and authentication interfaces.

### 2. Multi-Factor Authentication (MFA) Provisioning
Responsible for cryptographic secret generation, QR code rendering, and TOTP verification.
*   **Database:** Manages the `User_MFA_Factors` and `Recovery_Codes` tables. Handles state changes for single-use backup codes.
*   **Backend:** Exposes `/setup-mfa` for secret/QR generation and `/verify-mfa` for TOTP token validation.
*   **Frontend:** Renders the authenticator setup interface and the subsequent token input prompts.

### 3. Session Management & Security Auditing
Responsible for post-authentication lifecycle management and threat monitoring.
*   **Database:** Executes triggers for the `Audit_Log` (capturing IP addresses and User Agents). Manages `User_Session` states and updates `Security_State` (enforcing account lockouts after consecutive failed attempts).
*   **Backend:** Implements session validation middleware. Exposes the `/dashboard` endpoint for audit history retrieval.
*   **Frontend:** Renders the authenticated dashboard, displaying the security audit history and session termination controls.

## Standard Authentication Flow

1.  **Account Provisioning:** The user submits standard profile data and primary credentials. The backend hashes the password and writes the records to the database.
2.  **Initial Authentication (MFA Enforcement):** The user authenticates with primary credentials. The system checks the `User_MFA_Factors` state. Detecting no active MFA configuration, the system intercepts the standard routing and issues an MFA mandate.
3.  **MFA Configuration:** 
    *   The backend generates a secure string (`secret_data`).
    *   The system renders this secret as a QR code for ingestion by a TOTP application (e.g., Google Authenticator).
    *   The user inputs the initial 6-digit token to confirm synchronization.
    *   Upon successful validation, the system encrypts and stores the secret, updates the MFA status to active, and generates ten single-use recovery codes.
4.  **Standard Access:** Subsequent authentication requests require successful provision of both primary credentials and a valid, current TOTP token.