# Database Design

This folder contains all database-related documentation and design artifacts for the project, including:

- Entity Relationship Diagrams (ERDs)
- Entity Mapping Logic (EML)
- Database schemas
- PostgreSQL/PostGIS data models
- Database architecture documentation
- Production database design documents

The database architecture is built on **PostgreSQL** with **PostGIS** and is designed to support a multi-tenant agricultural platform.


## Online free tool used 
**dbdiagram.io **:  https://dbdiagram.io/d/CROP-6a4f215636d348d1209ec03d

## Included Database Domains

The documentation and diagrams in this folder cover the following core platform components:

- **User Management**
  - Users
  - Roles
  - Permissions
  - Audit Logs

- **Multi-Tenant Architecture**
  - Country Tenants

- **Agricultural Knowledge Base**
  - Crops
  - Categories
  - Reference Data

- **Farmer Management**
  - Farmer Profiles
  - Farms
  - Farm Boundaries (PostGIS)
  - Crop Records
  - Harvest Records

- **Crop Planning Engine**
  - Crop Plans
  - Recommendations
  - Seasonal Planning

- **Community Features**
  - Discussion Forum
  - Chat System

- **Gamification**
  - Achievements
  - Rewards
  - User Progress Tracking

- **Reporting & Analytics**
  - Reports
  - Dashboards
  - Analytics Cache

## Mermaid ER Diagram

This folder also includes **Mermaid ER Diagrams** that provide a visual representation of the database structure and relationships between entities.

The diagrams serve as the primary reference for:

- Database design
- Development
- Maintenance
- Performance optimization
- Future enhancements

## Technology Stack

- **PostgreSQL**
- **PostGIS**
- **Mermaid ER Diagrams**
- **Database Migrations**
- **Schema Versioning**

## Purpose

> This folder serves as the **single source of truth** for all database architecture, schema definitions, ERDs, and production database design documentation throughout the project lifecycle.
