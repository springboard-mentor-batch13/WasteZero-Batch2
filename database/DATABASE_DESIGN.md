# WasteZero Database Design

Database Name: WasteZero

Database Used:
MongoDB Atlas

## Collections

1. users
2. pickups


# Users Collection

Stores application user information including Volunteers, NGOs, and Admin users.

Fields:

- _id : ObjectId
- fullName : String
- username : String
- email : String (unique)
- password : String (hashed)
- role : String
- location : String
- skills : Array
- bio : String
- profileImage : String
- createdAt : Date
- updatedAt : Date


# Pickups Collection

Stores waste pickup requests and opportunities.

Fields:

- _id : ObjectId
- userId : ObjectId (Reference users)
- title : String
- description : String
- wasteType : String
- quantity : String
- pickupLocation : String
- pickupDate : Date
- status : String
- createdAt : Date
- updatedAt : Date


# Relationships

User → Pickups

One user can create multiple pickup requests.

Relationship:
users._id → pickups.userId