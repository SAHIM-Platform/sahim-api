<h1>Authentication & Authorization Development Guide</h1>

This document provides a simple explanation for developers on **how authentication and authorization work** in the system and how to configure them for different use cases.

---

- [How Authentication Works](#how-authentication-works)
- [How to Make an Endpoint Public](#how-to-make-an-endpoint-public)
  - [Example: Public Route (No Authentication Required)](#example-public-route-no-authentication-required)
- [How to Restrict an Endpoint to Specific Roles (`@Roles()`)](#how-to-restrict-an-endpoint-to-specific-roles-roles)
  - [Example 1: Restrict to Only `ADMIN` Users](#example-1-restrict-to-only-admin-users)
  - [Example 2: Restrict to `ADMIN` and `STUDENT`](#example-2-restrict-to-admin-and-student)
- [Default Behavior for Routes Without Decorators](#default-behavior-for-routes-without-decorators)
  - [Example 1: No `@Roles()` and No `@Public()`](#example-1-no-roles-and-no-public)
  - [Example 2: No `@Roles()`, but `@Public()` Applied](#example-2-no-roles-but-public-applied)
- [FAQ (Frequently Asked Questions)](#faq-frequently-asked-questions)
  - [1️. What happens if both `@Public()` and `@Roles()` are used on the same route?](#1️-what-happens-if-both-public-and-roles-are-used-on-the-same-route)
  - [2. How do I make a route accessible to everyone (even non-logged-in users)?](#2-how-do-i-make-a-route-accessible-to-everyone-even-non-logged-in-users)
- [Summary](#summary)

---

## How Authentication Works

- The system uses **JWT authentication** to secure endpoints.
- Upon **signin/signup**, users receive two tokens:
  1. **Access Token**:
     - Provided in the response as `accessToken`.
     - Must be included in all **non-public** requests as a **Bearer token** in the `Authorization` header.
  2. **Refresh Token**:
     - Stored in an **HTTP-only cookie**.
     - Hashed and stored in the database.
     - Used in **signout** and **refresh token rotation**.
- **Authentication is enforced globally** using `JwtAuthGuard`, meaning that all routes require authentication by default unless explicitly made public. See [How to Make an Endpoint Public](#-making-an-endpoint-public-public)

---

## How to Make an Endpoint Public

By default, all endpoints **require authentication**. If you want to allow access **without requiring signin**, use the `@Public()` decorator.

### Example: Public Route (No Authentication Required)

```typescript
import { Public } from '../decorators/public.decorator';

@Controller('auth')
export class AuthController {
  @Public()
  @Post('signup')
  signup(@Body() input: SignupAuthDto, @Res() res: Response) {
    return this.authService.signup(input, res);
  }

  @Public()
  @Post('signin')
  signin(@Body() input: SigninAuthDto, @Res() res: Response) {
    return this.authService.signin(input, res);
  }
}
```

❌ **Without `@Public()`**, these endpoints would require authentication.

✅ **With `@Public()`**, users can access them without signing in.

---

## How to Restrict an Endpoint to Specific Roles (`@Roles()`)

By default, if a route **does not have `@Roles()`**, any authenticated user can access it.  
If you want to **restrict an endpoint to specific roles**, use the `@Roles()` decorator.

### Example 1: Restrict to Only `ADMIN` Users

```typescript
import { Roles } from '../decorators/role.decorator';

@Controller('admin')
export class AdminController {
  @Roles('ADMIN')
  @Get('dashboard')
  getAdminDashboard() {
    return { message: 'Welcome, admin!' };
  }
}
```

✅ **Only users with the `ADMIN` role can access this endpoint**.

❌ **Other authenticated users will get a `403 Forbidden` error**.

### Example 2: Restrict to `ADMIN` and `STUDENT`

```typescript
@Roles('ADMIN', 'STUDENT')
@Get('shared-dashboard')
getSharedDashboard() {
  return { message: 'Welcome, Admin or Student!' };
}
```

✅ **Both `ADMIN` and `STUDENT` roles can access this endpoint**.

---

## Default Behavior for Routes Without Decorators

| Scenario                                      | Behavior                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| **No `@Roles()` and No `@Public()`**          | Requires authentication, but any authenticated user can access it.        |
| **No `@Roles()`, but `@Public()` is applied** | Anyone (authenticated or not) can access the endpoint.                    |
| **Has `@Roles()`, but no `@Public()`**        | Requires authentication and allows only users with the specified role(s). |

### Example 1: No `@Roles()` and No `@Public()`

```typescript
@Controller('users')
export class UsersController {
  @Get('profile')
  getUserProfile(@Req() req) {
    return req.user;
  }
}
```

✅ Any **authenticated user** can access this.

❌ **Unauthenticated users cannot access it (401 Unauthorized).**

### Example 2: No `@Roles()`, but `@Public()` Applied

```typescript
@Public()
@Get('open-data')
getOpenData() {
  return { message: 'This is accessible to everyone.' };
}
```

✅ **Anyone can access this, even without authentication.**

---

## FAQ (Frequently Asked Questions)

### 1️. What happens if both `@Public()` and `@Roles()` are used on the same route?

If `@Public()` is applied, it **skips authentication**, meaning `@Roles()` will not be enforced.
**In short: `@Public()` overrides `@Roles()`**, making the role check irrelevant.

**Example**:

```typescript
@Public()
@Roles(UserRole.ADMIN)
@Get('admin-dashboard')
getAdminDashboard() {
  return { message: 'Admin-only dashboard' };
}
```

✅ **Anyone (even unauthenticated users) can access this.**

❌ **Role restrictions (`@Roles(UserRole.ADMIN)`) will not be enforced.**

### 2. How do I make a route accessible to everyone (even non-logged-in users)?

Use `@Public()` to **bypass authentication**.

**Example:**

```typescript
@Public()
@Get('public-info')
getPublicInfo() {
  return { message: 'Anyone can access this.' };
}
```

---

## Summary

- **All routes require authentication by default.**
- **Use `@Public()` to allow access without authentication.**
- **Use `@Roles()` to restrict access to specific roles.**
- **Routes without `@Roles()` allow any authenticated user.**
- **Avoid using `@Public()` and `@Roles()` together.**
