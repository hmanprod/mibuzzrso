# TimeAgo Functionality

This module provides timeago functionality with support for both English and French languages in your Next.js application.

## Features

- Format dates in a human-readable "time ago" format
- Support for both English and French languages
- Automatic browser language detection
- React component with language toggle option

## Usage

### Basic Usage

```typescript
import { formatTimeago } from '@/lib/timeago';

// English (default)
formatTimeago(new Date('2023-01-01')); // "2 years ago"

// French
formatTimeago(new Date('2023-01-01'), 'fr'); // "il y a 2 ans"

// With automatic language detection based on browser settings
import { formatTimeago, getUserLanguage } from '@/lib/timeago';
formatTimeago(new Date('2023-01-01'), getUserLanguage());
```

### React Component

```tsx
import { TimeAgo } from '@/components/ui/TimeAgo';

// Basic usage with default language (English)
<TimeAgo date={new Date('2023-01-01')} />

// With French language
<TimeAgo date={new Date('2023-01-01')} defaultLanguage="fr" />

// With language toggle button
<TimeAgo date={new Date('2023-01-01')} showLanguageToggle={true} />
```

## Example Page

Visit `/examples/timeago` in your application to see a demonstration of the TimeAgo functionality with various date examples and language switching options.

## Implementation Details

- Uses the `timeago.js` library (version 4.0.2)
- Custom French locale implementation
- TypeScript support with proper type definitions
- Client-side language detection
