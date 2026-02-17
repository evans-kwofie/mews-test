# Mews API - Engineering Summary

> Reference document for the team. Covers the **Connector API** (backend/property management) and the **Booking Engine API** (guest-facing booking flows).

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Authentication](#authentication)
- [Environments & Demo Credentials](#environments--demo-credentials)
- [Request & Response Format](#request--response-format)
- [Rate Limiting](#rate-limiting)
- [Pagination](#pagination)
- [Multi-Language / Localization](#multi-language--localization)
- [Connector API Operations](#connector-api-operations)
  - [Configuration](#configuration)
  - [Enterprises (Properties)](#enterprises-properties)
  - [Services (Room Types, Bookable Items)](#services-room-types-bookable-items)
  - [Availability](#availability)
  - [Reservations](#reservations)
  - [Customers](#customers)
- [Booking Engine API](#booking-engine-api)
  - [Integration Options](#integration-options)
  - [Get Hotel Info](#get-hotel-info)
  - [Get Availability](#get-availability-booking-engine)
  - [Create Reservation Group](#create-reservation-group)
- [Key Constraints & Limits](#key-constraints--limits)
- [Deprecated Features to Avoid](#deprecated-features-to-avoid)
- [MCP Server (Dev Tooling)](#mcp-server-dev-tooling)
- [Useful Links](#useful-links)

---

## Architecture Overview

Mews exposes two separate APIs:

| API | Purpose | Base URL (Demo) | Auth Model |
|-----|---------|-----------------|------------|
| **Connector API** | Backend integration: manage properties, reservations, customers, billing, services | `https://api.mews-demo.com` | ClientToken + AccessToken in body |
| **Booking Engine API** (Distributor) | Guest-facing: search rooms, check availability, create bookings | `https://api.mews-demo.com` | Client string + HotelId |

Both APIs are **POST-only** with JSON bodies. No GET endpoints.

---

## Authentication

### Connector API

Every request body must include three fields:

```json
{
  "ClientToken": "your-client-token",
  "AccessToken": "your-access-token",
  "Client": "YourApp/1.0.0"
}
```

| Field | What it is |
|-------|-----------|
| `ClientToken` | Identifies your integration app. Issued by Mews after certification. |
| `AccessToken` | Identifies the specific property/enterprise. Issued by the property admin. |
| `Client` | Free-text string, your app name + version. |

**Portfolio Access Tokens** allow one token to manage multiple properties in an organization. When using these, most operations require an explicit `EnterpriseId` param.

Tokens are **environment-specific** -- demo tokens don't work in production.

### Booking Engine API

Simpler model:
- Pass a `Client` string (app name) in the request body
- Authorization is based on knowing the `HotelId` (UUID)
- No ClientToken/AccessToken pair needed
- `Client` name must be registered with Mews Support (demo has a sample: `"My Client 1.0.0"`)

### Production Certification Flow

1. Develop and test against the demo environment
2. Complete the Mews certification process
3. Receive your permanent `ClientToken`
4. Each property generates their own `AccessToken`

---

## Environments & Demo Credentials

### URLs

| Environment | REST API | WebSocket |
|-------------|----------|-----------|
| Demo | `https://api.mews-demo.com` | `wss://ws.mews-demo.com` |
| Production | `https://api.mews.com` | `wss://ws.mews.com` |

### Connector API Demo Credentials

There are 4 credential pairs per pricing type to spread rate-limit load. These are **public/shared** -- never put real data in demo.

#### Gross Pricing (UK-based, taxes included in price)

| # | ClientToken | AccessToken |
|---|-------------|-------------|
| 1 | `E0D439EE522F44368DC78E1BFB03710C-D24FB11DBE31D4621C4817E028D9E1D` | `C66EF7B239D24632943D115EDE9CB810-EA00F8FD8294692C940F6B5A8F9453D` |
| 2 | `E916C341431C4D28A866AD200152DBD3-A046EB5583FFBE94DE1172237763712` | `CC150C355D6A4048A220AD20015483AB-B6D09C0C84B09538077CB8FFBB907B4` |
| 3 | `2CC71B0660F345019882AD200155B4FE-4A1FC9080A4DD2A404734003674F77E` | `5F56B9903A834F199E28AD20015E58CA-5C6A1A00550634911534AD6A098E8B7` |
| 4 | `07AB1F14B55C49B8BDD6AD200158423B-273A4497AFF5E20566D7199DB3DC2BA` | `39E301DD5A1C4A569087AD20015F60DD-50DC28896E9090CCA0995C9BBD90351` |

#### Net Pricing (US/Washington DC, taxes excluded from price)

Same ClientTokens as above. Different AccessTokens:

| # | AccessToken |
|---|-------------|
| 1 | `4D6C7ABE0E6A4681B0AFB16900AE5D86-DF50CBC89E1D4FF5859DDF021649ED5` |
| 2 | `1AEFA58C55E74D65BDC7AD2001564C12-66633E0B736F523379B9E5966165A55` |
| 3 | `682C235379B64D909941AD2001577525-BFC60A026081F1350FAA99CAB9F7510` |
| 4 | `BFD4298010F54B069F3DAD20015D53EA-D5561FADFBA4EFC8EA4C179C6BC461F` |

Both environments support GBP, EUR, USD.

### Booking Engine Demo Credentials

| Field | Value |
|-------|-------|
| Hotel Id | `3edbe1b4-6739-40b7-81b3-d369d9469c48` |
| Configuration Id | `93e27b6f-cba7-4e0b-a24a-819e1b7b388a` |
| Portal URL | `https://app.mews-demo.com` |
| Portal Email | `distributor-api@mews.li` |
| Portal Password | `Distributor-api1` |

---

## Request & Response Format

### Requests

- **Method**: `POST` (all endpoints)
- **Content-Type**: `application/json`
- **Dates**: UTC, ISO 8601 -- `2024-06-01T00:00:00Z`
- **Durations**: ISO 8601 -- `P0Y0M1DT0H0M0S`
- **Time intervals**: Inclusive of start and end, using `StartUtc` / `EndUtc`

### Partial Update Pattern

For update operations, fields follow this convention:
- **Omit field** = leave unchanged
- **Send `{ "Value": "newValue" }`** = set new value
- **Send `{ "Value": null }`** = clear (nullable fields only)

### Responses

- **Content-Type**: `application/json`
- Every response includes a `Request-Id` header for tracing/support

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `204` | Success, no body |
| `400` | Bad request / invalid input |
| `401` | Invalid or expired credentials |
| `403` | Business logic validation failure |
| `404` | Resource not found |
| `408` | Request timeout |
| `409` | Conflict (data changed during processing) |
| `413` | Payload too large |
| `429` | Rate limit exceeded -- check `Retry-After` header |
| `5xx` | Server error |

### Error Body

```json
{
  "Message": "Human-readable error description",
  "RequestId": "unique-id-for-support",
  "Details": "Additional context (dev environments only)"
}
```

---

## Rate Limiting

**200 requests per AccessToken per rolling 30-second window.**

- Exceeding returns `429` with `Retry-After` header (seconds to wait)
- These params may change without notice -- always handle 429 gracefully
- No IP allowlisting supported

---

## Pagination

Cursor-based pagination via a `Limitation` object. Used on all `getAll` operations.

### Request

```json
{
  "Limitation": {
    "Count": 100,
    "Cursor": null
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `Count` | integer | Items per page. Min: 1, Max: 1000 |
| `Cursor` | string \| null | `null` for first page, then use the cursor from the previous response |

### Response

```json
{
  "SomeEntities": [...],
  "Cursor": "abc123-cursor-value"
}
```

### Iteration Algorithm

```
1. Request with Cursor: null, Count: 1000
2. Process returned items
3. If response Cursor is not null → use it in next request, go to 2
4. If Cursor is null OR fewer items than Count → done
```

---

## Multi-Language / Localization

### Connector API

Text fields use a localized object keyed by language-culture codes:

```json
{
  "Names": {
    "en-US": "Accommodation",
    "de-DE": "Unterkunft",
    "fr-FR": "Hebergement"
  }
}
```

- The enterprise's `DefaultLanguageCode` indicates the primary language
- `configuration/get` tells you which languages the property supports
- Customer profiles have a `PreferredLanguageCode` field

### Booking Engine API

Pass `LanguageCode` + `CultureCode` in the request body to receive localized responses:

```json
{
  "Client": "MyApp/1.0.0",
  "HotelId": "...",
  "LanguageCode": "de",
  "CultureCode": "de-DE"
}
```

Both must be specified together or both omitted.

---

## Connector API Operations

All endpoints: `POST https://api.mews-demo.com/api/connector/v1/{resource}/{operation}`

### Configuration

**`configuration/get`** -- Get full property config including currencies, languages, address, pricing model.

```json
{
  "ClientToken": "...",
  "AccessToken": "...",
  "Client": "MyApp/1.0.0",
  "EnterpriseId": "optional, required for portfolio tokens"
}
```

Response includes:
- `Enterprise` -- Id, Name, ChainId, TimeZoneIdentifier, DefaultLanguageCode, Address (with lat/lng), Pricing (`Gross` | `Net`), WebsiteUrl, Email, Phone, LogoImageId, CoverImageId
- `Enterprise.Currencies[]` -- with `IsDefault`, `IsEnabled` flags
- Environment codes: LegalEnvironmentCode, TaxEnvironmentCode, etc.
- `AccountingConfiguration` -- bank details, surcharge config, payment types

### Enterprises (Properties)

**`enterprises/getAll`** -- List properties (multi-property scenarios).

```json
{
  "ClientToken": "...",
  "AccessToken": "...",
  "Client": "MyApp/1.0.0",
  "EnterpriseIds": ["optional-filter"],
  "ExternalIdentifiers": ["optional-filter"],
  "LinkedUtc": { "StartUtc": "...", "EndUtc": "..." },
  "UpdatedUtc": { "StartUtc": "...", "EndUtc": "..." },
  "Limitation": { "Count": 100, "Cursor": null }
}
```

All filters are optional. `LinkedUtc` and `UpdatedUtc` max 3 months. Array filters max 1000 items.

### Services (Room Types, Bookable Items)

**`services/getAll`** -- Get all bookable services (accommodation, spa, etc).

```json
{
  "ClientToken": "...",
  "AccessToken": "...",
  "Client": "MyApp/1.0.0",
  "ServiceIds": ["optional"],
  "ServiceType": "Bookable",
  "UpdatedUtc": { "StartUtc": "...", "EndUtc": "..." },
  "Limitation": { "Count": 100, "Cursor": null }
}
```

Response `Services[]` includes:
- `Id`, `EnterpriseId`, `IsActive`
- `Names` -- localized text object (see multi-language section)
- `Data` -- includes `StartOffset`, `EndOffset`, `TimeUnitPeriod`
- `ExternalIdentifier` (max 255 chars)

### Availability

**`services/getAvailability/2024-01-22`** (use this versioned endpoint)

```json
{
  "ClientToken": "...",
  "AccessToken": "...",
  "Client": "MyApp/1.0.0",
  "ServiceId": "service-uuid",
  "FirstTimeUnitStartUtc": "2024-06-01T00:00:00Z",
  "LastTimeUnitStartUtc": "2024-06-07T00:00:00Z",
  "Metrics": ["Occupied", "ConfirmedReservations", "OutOfOrderBlocks"]
}
```

Available Metrics: `OutOfOrderBlocks`, `PublicAvailabilityAdjustment`, `OtherServiceReservationCount`, `Occupied`, `ConfirmedReservations`, `OptionalReservations`, `BlockAvailability`, `AllocatedBlockAvailability`, `UsableResources`, `ActiveResources`

Max intervals: 367 hours (hourly), 367 days (daily), 60 months (monthly).

**`services/updateAvailability`** -- Adjust availability counts.

```json
{
  "ClientToken": "...",
  "AccessToken": "...",
  "Client": "MyApp/1.0.0",
  "ServiceId": "...",
  "AvailabilityUpdates": [
    {
      "FirstTimeUnitStartUtc": "...",
      "LastTimeUnitStartUtc": "...",
      "ResourceCategoryId": "...",
      "UnitCountAdjustment": 5
    }
  ]
}
```

Max 1000 updates per call. Cannot update past availability outside `EditableHistoryInterval`. Future updates allowed up to 5 years.

### Reservations

**`reservations/getAll/2023-06-06`** (use this versioned endpoint)

Lots of filter options (all optional except `Limitation`):

| Filter | Type | Max |
|--------|------|-----|
| `ReservationIds` | string[] | 1000 |
| `ServiceIds` | string[] | 1000 |
| `AccountIds` | string[] | 1000 |
| `ReservationGroupIds` | string[] | 1000 |
| `AssignedResourceIds` | string[] | 1000 |
| `States` | string[] | -- |
| `Numbers` | string[] | 1000 |
| `ChannelNumbers` | string[] | 100 |
| `PartnerCompanyIds` | string[] | 100 |
| `TravelAgencyIds` | string[] | 100 |
| `AvailabilityBlockIds` | string[] | 100 |
| `EnterpriseIds` | string[] | 1000 |
| `CreatedUtc` / `UpdatedUtc` | TimeInterval | 3 months |
| `ScheduledStartUtc` / `ScheduledEndUtc` | TimeInterval | 3 months |
| `ActualStartUtc` / `ActualEndUtc` | TimeInterval | 3 months |
| `CollidingUtc` | TimeInterval | 3 months |

**Reservation States**: `Inquired`, `Confirmed`, `Started` (checked in), `Processed` (checked out), `Canceled`, `Optional`, `Requested`

**Reservation Origins**: `Distributor`, `ChannelManager`, `Commander`, `Import`, `Connector`, `Navigator`

**`reservations/add`** -- Create new reservations.

```json
{
  "ClientToken": "...",
  "AccessToken": "...",
  "Client": "MyApp/1.0.0",
  "ServiceId": "...",
  "Reservations": [
    {
      "State": "Confirmed",
      "StartUtc": "2024-06-01T14:00:00Z",
      "EndUtc": "2024-06-05T10:00:00Z",
      "CustomerId": "customer-uuid",
      "RequestedCategoryId": "room-category-uuid",
      "RateId": "rate-uuid",
      "Notes": "Late check-in",
      "PersonCounts": [{ "AgeCategoryId": "...", "Count": 2 }],
      "Identifier": "client-side-idempotency-key"
    }
  ],
  "CheckOverbooking": true,
  "SendConfirmationEmail": true
}
```

### Customers

**`customers/getAll`** -- At least one filter is required.

```json
{
  "ClientToken": "...",
  "AccessToken": "...",
  "Client": "MyApp/1.0.0",
  "Emails": ["guest@example.com"],
  "Extent": { "Customers": true, "Addresses": true, "Documents": false },
  "Limitation": { "Count": 100, "Cursor": null }
}
```

Filter options: `CustomerIds`, `Emails`, `FirstNames`, `LastNames`, `LoyaltyCodes`, `CompanyIds`, `ChainIds`, `CreatedUtc`, `UpdatedUtc`, `DeletedUtc`, `ActivityStates`.

**`customers/add`** -- Create a new customer. Only `LastName` is required.

```json
{
  "ClientToken": "...",
  "AccessToken": "...",
  "Client": "MyApp/1.0.0",
  "LastName": "Smith",
  "FirstName": "John",
  "Email": "john@example.com",
  "Phone": "+1234567890",
  "NationalityCode": "US",
  "OverwriteExisting": false
}
```

**`customers/update`** -- Partial update. Only `CustomerId` is required.

---

## Booking Engine API

All endpoints: `POST https://api.mews-demo.com/api/distributor/v1/{resource}/{operation}`

**Important**: This API is designed for **front-end clients only**. It has anti-scraping protections -- server-side polling will fail. Use the Connector API for backend integrations.

### Integration Options

| Method | Description | Complexity | Requirement |
|--------|-------------|------------|-------------|
| **Standalone** | Redirect to Mews-hosted booking page | Simplest | Any subscription |
| **Widget** | Embed JS widget on your site | Medium | Any subscription |
| **API** | Build fully custom booking UI | Advanced | Enterprise subscription |

### Get Hotel Info

**`hotels/get`**

```json
{
  "Client": "MyApp/1.0.0",
  "HotelId": "3edbe1b4-6739-40b7-81b3-d369d9469c48"
}
```

Returns: `Name` (localized), `Description` (localized), `RoomCategories[]` (with bed counts, space type), `Products[]` (pricing/charging mode), `Languages[]`, `Currencies[]`, `PaymentGateway`, `Address`, `Email`, `Telephone`, `TermsAndConditionsUrl`.

### Get Availability (Booking Engine)

**`hotels/getAvailability`**

```json
{
  "Client": "MyApp/1.0.0",
  "ConfigurationId": "93e27b6f-cba7-4e0b-a24a-819e1b7b388a",
  "HotelId": "3edbe1b4-6739-40b7-81b3-d369d9469c48",
  "StartUtc": "2024-06-01T00:00:00Z",
  "EndUtc": "2024-06-07T00:00:00Z",
  "OccupancyData": [
    { "AgeCategoryId": "adult-age-category-id", "PersonCount": 2 }
  ],
  "CurrencyCode": "EUR",
  "VoucherCode": "SUMMER2024",
  "CategoryIds": ["specific-room-category-id"]
}
```

Returns: `RateGroups[]`, `Rates[]` (name, description), `RoomCategoryAvailabilities[]` with `AvailableRoomCount` and per-occupancy pricing (total, average per night, tax breakdown).

**Gotcha**: Unavailable room categories are **excluded entirely** from the response (not returned with zero count).

### Create Reservation Group

**`reservationGroups/create`**

```json
{
  "Client": "MyApp/1.0.0",
  "ConfigurationId": "...",
  "HotelId": "...",
  "Customer": {
    "Email": "guest@example.com",
    "FirstName": "John",
    "LastName": "Smith",
    "Telephone": "+1234567890",
    "NationalityCode": "US",
    "SendMarketingEmails": false
  },
  "Reservations": [
    {
      "RoomCategoryId": "...",
      "StartUtc": "2024-06-01T00:00:00Z",
      "EndUtc": "2024-06-07T00:00:00Z",
      "RateId": "...",
      "AdultCount": 2,
      "ChildCount": 0,
      "ProductIds": [],
      "Notes": "Anniversary trip"
    }
  ]
}
```

Returns: `Id`, `CustomerId`, `Reservations[]`, `PaymentRequestId`, `TotalAmount`.

**Gotcha**: If "Enable automatic cancellation for optional reservations" is on, unpaid reservations get state `Optional` until payment completes.

### Other Booking Engine Endpoints

- `reservations/getPricing` -- detailed pricing breakdown before booking
- `vouchers/validate` -- validate promo/voucher codes
- `hotels/getPaymentConfiguration` -- payment gateway & surcharge config
- `configuration/get` -- full config with themes, display settings, currencies
- `availabilityBlocks/getAll` -- group/block bookings

---

## Key Constraints & Limits

| Constraint | Value |
|------------|-------|
| Rate limit | 200 req / 30 sec per AccessToken |
| Max page size (`Limitation.Count`) | 1000 |
| Max time interval filter | 3 months |
| Max availability query | 367 days (daily) / 367 hours (hourly) / 60 months (monthly) |
| Max availability updates per call | 1000 |
| Max array filter items | 1000 (general), 100 (some filters) |
| ExternalIdentifier max length | 255 characters |
| Customer Number max length | 19 characters |
| Future availability update horizon | 5 years |
| IP allowlisting | Not supported |

---

## Deprecated Features to Avoid

| Deprecated | Use Instead |
|-----------|-------------|
| `reservations/getAll` (unversioned) | `reservations/getAll/2023-06-06` |
| `services/getAvailability` (unversioned) | `services/getAvailability/2024-01-22` |
| Customer `Address` field in response | Use `AddressId` + fetch separately |
| `customers/getOpenItems` | Use `Get all payments` + `Get all order items` |
| Customer `ActivityState` enum | Use `IsActive` boolean |
| Customer identity doc fields (Passport, etc.) | Use dedicated identity document endpoints |

---

## MCP Server (Dev Tooling)

We use the unofficial [mews-mcp](https://github.com/code-rabi/mews-mcp) server for AI-assisted development. Config is in `.mcp.json` at project root.

Currently configured with **Net Pricing (US/DC)** demo credentials. To switch to Gross Pricing (UK), swap the `MEWS_ACCESS_TOKEN` value in `.mcp.json`.

---

## Useful Links

| Resource | URL |
|----------|-----|
| Connector API Docs | https://docs.mews.com/connector-api |
| Connector API Operations | https://docs.mews.com/connector-api/operations |
| Booking Engine Guide | https://docs.mews.com/booking-engine-guide |
| Booking Engine API | https://docs.mews.com/booking-engine-guide/booking-engine-api |
| OpenAPI Spec (Booking Engine) | https://api.mews.com/swagger/distributor/swagger.json |
| Demo Portal | https://app.mews-demo.com |
| MCP Server (GitHub) | https://github.com/code-rabi/mews-mcp |
| Share Token Guide | https://help.mews.com/s/article/how-to-share-client-and-access-token |
