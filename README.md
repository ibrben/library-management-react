# Library Management Frontend (Archelik Hitachi test)

React Next.JS for library management that user can borrowing, returns, and view transaction history. 

## Stack
* ReactJS with NextJS
* Typescript
* TailwindCSS
* JWT Authentication

## Design 
### Core Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Porcelain | `#F9F8F6` | Primary page background and lightest surface |
| Linen | `#EFE9E3` | Secondary surfaces, icon backgrounds, subtle highlights |
| Stone | `#D9CFC7` | Borders, dividers, inactive controls |
| Bronze | `#C9B59C` | Premium accent, focus details, restrained emphasis |



## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with any browser to see the result.

## Features
### Search Features

Support
* Title
* Author
* ISBN
* Category
* Availability

Additional
* Sorting
* Pagination
* Multi-filter
* Instant Search

### Borrow & Return

Member
* Perform borrow & return on their own

Librarian / Admin
* Perform borrow & return for any Member


### Transaction history

Member
* View their own history
Librarian / Admin
* View everyone transaction