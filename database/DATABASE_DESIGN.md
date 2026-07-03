# WasteZero Database Design

## Milestone 1: User Management


## Database Information

Database Name:

```
wastezero
```

Database Platform:

```
MongoDB Atlas
```


## Users Collection

Fields:

- username
- fullName
- email
- password
- role
- location
- skills
- createdAt
- updatedAt


### Purpose

Stores user information required for:

- User Registration
- Authentication
- Role Based Access Control
- Profile Management


## Users Schema

```javascript
{
    username: String,

    fullName: String,

    email: String,

    password: String,

    role: String,

    location: String,

    skills: Array
}
```


## Field Details

| Field | Type | Required | Description |
|----|----|----|----|
| username | String | Yes | Unique username |
| fullName | String | Yes | User full name |
| email | String | Yes | Unique login email |
| password | String | Yes | Hashed password |
| role | String | Yes | Volunteer / NGO / Admin |
| location | String | No | User location |
| skills | Array | No | User skills |


## User Roles

Allowed roles:

- Volunteer
- NGO
- Admin


## Indexes Created

| Field | Type |
|-|-|
| username | Unique |
| email | Unique |
| role | Normal Index |


## Security Notes

- Passwords are stored after hashing by backend.
- MongoDB Atlas connection string is stored in environment variables.
- Database credentials are not pushed to GitHub.