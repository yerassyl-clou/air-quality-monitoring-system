# Air Quality Monitoring and Environmental Complaint Analysis System

## ER Relationships

- `User 1 --- 1 UserProfile`
- `User 1 --- * Notification`
- `User 1 --- * Report`
- `Location 1 --- * Report`
- `Location 1 --- * AirQualityData`
- `Recommendation` stores AQI ranges for rule-based matching
