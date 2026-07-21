# WasteZero Database Design

Database Name: WasteZero

Database Used:
MongoDB Atlas

## Collections

1. Users
2. Pickups
3. Opportunities

---

# Users Collection

Stores application user information including Volunteers, NGOs, and Admin users.

## Fields

- _id : ObjectId
- fullName : String
- username : String
- email : String (unique)
- password : String (hashed)
- role : String (Volunteer | NGO | Admin)
- city : String
- state : String
- skills : Array
- bio : String
- profileImage : String
- createdAt : Date
- updatedAt : Date

---

# Pickups Collection

Stores waste pickup requests.

## Fields

- _id : ObjectId
- userId : ObjectId (Reference Users)
- title : String
- description : String
- wasteType : String
- quantity : String
- pickupLocation : String
- pickupDate : Date
- status : String
- createdAt : Date
- updatedAt : Date

---

# Opportunities Collection

Stores volunteering opportunities created by NGOs.

## Fields

- _id : ObjectId
- ngoId : ObjectId (Reference Users)
- title : String
- description : String
- requiredSkills : Array<String>
- duration : String
- location : String
- date : Date
- status : String (Open | Closed | Completed)
- createdAt : Date
- updatedAt : Date

### Field Description

| Field | Data Type | Description |
|--------|-----------|-------------|
| _id | ObjectId | Unique identifier for the opportunity |
| ngoId | ObjectId | Reference to the NGO who created the opportunity |
| title | String | Title of the volunteering opportunity |
| description | String | Detailed description of the opportunity |
| requiredSkills | Array<String> | Skills required for volunteers |
| duration | String | Duration of the volunteering activity |
| location | String | Location where the event will be conducted |
| date | Date | Scheduled date of the opportunity |
| status | String | Current status (Open, Closed, Completed) |
| createdAt | Date | Timestamp when the opportunity was created |
| updatedAt | Date | Timestamp when the opportunity was last updated |

---

# Relationships

## Users → Pickups

One user can create multiple pickup requests.

Relationship:

```
Users._id  →  Pickups.userId
```

---

## Users (NGO) → Opportunities

One NGO user can create multiple volunteering opportunities.

Relationship:

```
Users._id  →  Opportunities.ngoId
```

---

# Collection Summary

| Collection | Purpose |
|------------|---------|
| Users | Stores user accounts (Volunteer, NGO, Admin) |
| Pickups | Stores waste pickup requests |
| Opportunities | Stores volunteering opportunities created by NGOs |

## Implementation Notes

- User `_id` is generated automatically by MongoDB during registration.
- The same `_id` is used throughout the user's lifetime.
- `ngoId` in the Opportunities collection is automatically populated by the backend using the logged-in NGO user's `_id`.
- Frontend should never send `ngoId`, `volunteerId`, or `userId` manually. These references should be derived from the authenticated user's JWT token.