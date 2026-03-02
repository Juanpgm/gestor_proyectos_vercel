import { expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

// Register jest-dom matchers with Vitest's expect
expect.extend(matchers)
