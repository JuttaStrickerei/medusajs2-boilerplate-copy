---
name: new-user
description: Create an admin user in Medusa. Use when setting up new admin accounts or during initial project setup.
---

# Create Admin User

Create a new admin user in Medusa with the specified email and password.

The user will provide two arguments:
- First argument: email address
- Second argument: password

For example: `new-user admin@test.com supersecret`

Use the Shell tool to execute the command `npx medusa user -e <email> -p <password>`, replacing `<email>` with the first argument and `<password>` with the second argument.

Report the results to the user, including:

- Confirmation that the admin user was created successfully
- The email address of the created user
- Any errors that occurred
- Next steps (e.g., logging in to the admin dashboard)
