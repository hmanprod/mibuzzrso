# Database Schema Documentation

This document describes the database schema for the MiBuzz RSO platform. The platform uses Supabase (PostgreSQL) as its database and Cloudinary for media storage.

## Tables Overview

### Medias
Stores information about media files (audio and video) uploaded to Cloudinary.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| media_type | ENUM | Type of media ('audio' or 'video') |
| media_url | TEXT | Cloudinary URL of the media |
| media_public_id | TEXT | Cloudinary public ID |
| duration | DECIMAL(10,2) | Duration in seconds |
| title | TEXT | Media title |
| description | TEXT | Media description |
| user_id | UUID | Reference to auth.users |

**Constraints:**
- `valid_media`: Ensures media_url is from Cloudinary
- Foreign key on user_id referencing auth.users

### Posts
Contains user posts which can include text content and multiple media items.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| content | TEXT | Post text content |
| user_id | UUID | Reference to auth.users |

**Constraints:**
- Foreign key on user_id referencing auth.users

### Posts_Medias
Junction table linking posts to media files, allowing multiple media per post.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| created_at | TIMESTAMP | Creation timestamp |
| post_id | UUID | Reference to posts |
| media_id | UUID | Reference to medias |
| position | INTEGER | Order of media in post |

**Constraints:**
- `unique_post_media`: Prevents duplicate media in a post
- `unique_post_media_position`: Ensures unique positions within a post
- Foreign keys on post_id and media_id

### Comments
Stores user comments on media with optional timestamp references.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| content | TEXT | Comment text |
| player_time | DECIMAL(10,2) | Timestamp in media (optional) |
| user_id | UUID | Reference to auth.users |
| media_id | UUID | Reference to medias |

**Constraints:**
- Foreign keys on user_id and media_id

### Interactions
Tracks user interactions (likes, shares, saves) with posts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| created_at | TIMESTAMP | Creation timestamp |
| type | ENUM | Type of interaction |
| user_id | UUID | Reference to auth.users |
| post_id | UUID | Reference to posts |

**Constraints:**
- `unique_user_post_interaction`: Prevents duplicate interactions
- Foreign keys on user_id and post_id

## Enums

### media_type
- `audio`: Audio files
- `video`: Video files

### interaction_type
- `like`: Like interaction
- `share`: Share interaction
- `save`: Save/bookmark interaction

## Indexes
- `idx_medias_user_id`: On medias(user_id)
- `idx_posts_user_id`: On posts(user_id)
- `idx_posts_medias_post_id`: On posts_medias(post_id)
- `idx_posts_medias_media_id`: On posts_medias(media_id)
- `idx_comments_user_id`: On comments(user_id)
- `idx_comments_media_id`: On comments(media_id)
- `idx_interactions_user_id`: On interactions(user_id)
- `idx_interactions_post_id`: On interactions(post_id)

## Row Level Security (RLS)

### Medias
- SELECT: Viewable by all authenticated users
- INSERT: Users can only insert their own media
- UPDATE/DELETE: Users can only modify their own media

### Posts
- SELECT: Viewable by all authenticated users
- INSERT: Users can only create their own posts
- UPDATE/DELETE: Users can only modify their own posts

### Posts_Medias
- SELECT: Viewable by all authenticated users
- INSERT/UPDATE/DELETE: Users can only modify entries for their own posts

### Comments
- SELECT: Viewable by all authenticated users
- INSERT: Users can only create their own comments
- UPDATE/DELETE: Users can only modify their own comments

### Interactions
- SELECT: Viewable by all authenticated users
- ALL: Users can only manage their own interactions

## Triggers
Automatic `updated_at` timestamp updates on:
- medias
- posts
- comments
