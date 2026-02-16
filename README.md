# Vicidial Automation User Bot

This project contains Puppeteer scripts to automate tasks in the Vicidial Admin interface, specifically for creating users and copying phone extensions.

## Prerequisites

- Node.js installed
- Vicidial Admin credentials
- `puppeteer` package

## Installation

1.  Clone the repository or download the files.
2.  Install dependencies:

    ```bash
    npm install
    ```

## Configuration

Both scripts contain configuration variables at the top of the file that you should update before running:

- `domain`: The domain of your Vicidial installation (e.g., `lead4s.letsscall.com`)
- `admin_username`: Your Vicidial admin username
- `admin_password`: Your Vicidial admin password
- `user_id_start` & `user_id_end`: The range of user/phone IDs to process

## Scripts

### 1. Create Users (`user.js`)

This script automates the creation of new users in Vicidial.

**Usage:**

```bash
node user.js
```

**Functionality:**
- Logs into the Vicidial Admin interface.
- Navigates to the "Users" section.
- Iterates through the specified ID range (`user_id_start` to `user_id_end`).
- Fills out the "Add A New User" form with standardized data based on the User ID.
- Submits the form and logs success/failure.

### 2. Copy Phones (`phone.js`)

This script automates copying an existing phone extension to create new ones.

**Usage:**

```bash
node phone.js
```

**Functionality:**
- Logs into the Vicidial Admin interface.
- Navigates to the "Phones" section.
- usage "Copy an Existing Phone" feature.
- Iterates through the specified ID range.
- Copies settings from a source phone (defined by `copy_from_user`).
- Creates new phone extensions with standardized credentials based on the User ID.

## Notes

- The scripts run in `headless: false` mode by default so you can see the automation in action.
- Ensure your IP is allowed if your Vicidial instance has IP restrictions.
