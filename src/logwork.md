
# Development Log

## 2025-03-17: Fixed Navigation Function Import Error

- Fixed TypeScript error in `useAuthMethods.ts` by updating import from `forceToDashboard` to `navigateToDashboard`
- Updated `useRedirectAuth.ts` to maintain API consistency while using the centralized navigation functions
- Ensured consistent navigation function names across the application

The issue was caused by a mismatch between the function names exported in `navigationService.ts` and the names being imported in `useAuthMethods.ts`. The fix ensures that all components use the centralized navigation service with consistent function names.
