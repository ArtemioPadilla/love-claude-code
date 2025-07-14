# Contributing to Love Claude Code

First off, thank you for considering contributing to Love Claude Code! It's people like you that make Love Claude Code such a great tool. We welcome contributions from everyone, regardless of their experience level.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Process](#development-process)
- [Style Guidelines](#style-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Standards

- **Be Respectful**: Treat everyone with respect. No harassment, discrimination, or inappropriate behavior.
- **Be Collaborative**: Work together effectively and assume good intentions.
- **Be Professional**: Maintain professionalism in all interactions.
- **Be Inclusive**: Welcome newcomers and help them get started.

## Getting Started

1. **Fork the Repository**: Click the "Fork" button on GitHub
2. **Clone Your Fork**: 
   ```bash
   git clone https://github.com/YOUR_USERNAME/love-claude-code.git
   cd love-claude-code
   ```
3. **Set Up Development Environment**: Follow our [Development Guide](./DEVELOPMENT.md)
4. **Create a Branch**: 
   ```bash
   git checkout -b feature/your-feature-name
   ```

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**How to Submit a Good Bug Report:**

1. Use a clear and descriptive title
2. Describe the exact steps to reproduce the problem
3. Provide specific examples
4. Describe the behavior you observed and expected
5. Include screenshots if applicable
6. Include your environment details:
   - OS and version
   - Node.js version
   - Browser and version
   - Love Claude Code version

**Bug Report Template:**
```markdown
## Bug Description
A clear and concise description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Screenshots
If applicable, add screenshots.

## Environment
- OS: [e.g., macOS 13.0]
- Node.js: [e.g., 20.0.0]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]

## Additional Context
Any other context about the problem.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues.

**How to Submit a Good Enhancement Suggestion:**

1. Use a clear and descriptive title
2. Provide a detailed description of the proposed enhancement
3. Explain why this enhancement would be useful
4. List any alternative solutions you've considered
5. Include mockups or examples if applicable

**Enhancement Template:**
```markdown
## Feature Description
A clear description of the feature.

## Problem Statement
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
What other solutions did you consider?

## Additional Context
Mockups, examples, or other context.
```

### Contributing Code

#### Your First Code Contribution

Unsure where to begin? Look for these labels:

- `good first issue` - Simple issues perfect for beginners
- `help wanted` - Issues where we need community help
- `documentation` - Documentation improvements
- `bug` - Known bugs that need fixing

#### Pull Requests

1. **Small, Focused Changes**: Keep PRs small and focused on a single issue
2. **Write Tests**: Add tests for new functionality
3. **Update Documentation**: Update docs if you change functionality
4. **Follow Style Guide**: Ensure your code follows our style guidelines
5. **Pass All Checks**: Make sure all tests and linters pass

### Contributing Documentation

Documentation is crucial! Here's how to help:

1. **Fix Typos and Grammar**: Even small fixes are valuable
2. **Improve Clarity**: Make complex topics easier to understand
3. **Add Examples**: Provide more code examples
4. **Create Tutorials**: Write how-to guides for common tasks
5. **Update Screenshots**: Keep visual content current

## Development Process

### 1. Setting Up Your Development Environment

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Run tests
npm test

# Check code style
npm run lint
```

### 2. Making Changes

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make Your Changes**:
   - Write clean, readable code
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**:
   ```bash
   # Run all tests
   npm test
   
   # Run specific tests
   npm test -- --testPathPattern=Chat
   
   # Check coverage
   npm run test:coverage
   ```

4. **Lint Your Code**:
   ```bash
   npm run lint
   npm run format
   ```

### 3. Committing Your Changes

Follow our commit message conventions (see [Commit Guidelines](#commit-guidelines)).

```bash
git add .
git commit -m "feat(chat): add message threading support"
```

### 4. Pushing Changes

```bash
git push origin feature/amazing-feature
```

### 5. Creating a Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your feature branch
4. Fill out the PR template
5. Submit the PR

## Style Guidelines

### TypeScript/JavaScript

We use ESLint and Prettier for code formatting. Run `npm run lint:fix` to automatically fix many issues.

**Key Guidelines:**

```typescript
// Use TypeScript for all new code
interface UserProps {
  name: string
  age: number
  email?: string // Optional properties
}

// Prefer const over let
const MAX_RETRIES = 3

// Use meaningful variable names
const userAuthenticationToken = generateToken() // Good
const token = generateToken() // Less descriptive

// Use async/await over promises
async function fetchUser(id: string) {
  try {
    const user = await api.getUser(id)
    return user
  } catch (error) {
    console.error('Failed to fetch user:', error)
    throw error
  }
}

// Document complex functions
/**
 * Calculates the optimal batch size based on available memory
 * @param totalItems - Total number of items to process
 * @param memoryLimit - Available memory in MB
 * @returns Optimal batch size
 */
function calculateBatchSize(totalItems: number, memoryLimit: number): number {
  // Implementation
}
```

### React Components

```typescript
// Use functional components with hooks
export function UserProfile({ userId }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false))
  }, [userId])
  
  if (loading) return <LoadingSpinner />
  if (!user) return <ErrorMessage>User not found</ErrorMessage>
  
  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      {/* Component content */}
    </div>
  )
}

// Use proper prop types
interface ButtonProps {
  onClick: () => void
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}
```

### CSS/Styling

We use Tailwind CSS for styling. Avoid inline styles.

```typescript
// Good - Using Tailwind classes
<div className="flex items-center gap-4 p-6 bg-card rounded-lg shadow-soft">

// Avoid - Inline styles
<div style={{ display: 'flex', padding: '24px' }}>

// Custom components with Tailwind
const Button = ({ variant, children }: ButtonProps) => {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-all"
  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90"
  }
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  )
}
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```bash
# Feature
feat(chat): add support for file attachments

# Bug fix
fix(editor): resolve syntax highlighting for JSX

# Documentation
docs(api): update authentication endpoint docs

# Refactoring
refactor(auth): simplify token validation logic

# Performance
perf(preview): optimize iframe reload performance

# With breaking change
feat(api): change response format for projects endpoint

BREAKING CHANGE: The projects endpoint now returns data in a different format.
Old format: { projects: [...] }
New format: { data: [...], meta: {...} }
```

## Pull Request Process

### Before Submitting

- [ ] Code compiles without warnings
- [ ] All tests pass
- [ ] Code coverage hasn't decreased
- [ ] Lint checks pass
- [ ] Documentation is updated
- [ ] Commit messages follow guidelines

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Related Issue
Fixes #(issue number)

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How Has This Been Tested?
Describe your testing process.

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] My code follows the project style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests for my changes
- [ ] All tests pass locally
```

### Review Process

1. **Automated Checks**: CI runs tests, linting, and security scans
2. **Code Review**: At least one maintainer reviews the code
3. **Testing**: Changes are tested in a staging environment
4. **Documentation Review**: Docs are reviewed if changed
5. **Merge**: Once approved, PR is merged using "Squash and merge"

### After Your PR is Merged

1. Delete your feature branch
2. Pull the latest main branch
3. Celebrate your contribution! 🎉

## Community

### Getting Help

- **Discord**: Join our [Discord server](https://discord.gg/love-claude-code)
- **GitHub Discussions**: Ask questions and share ideas
- **Stack Overflow**: Tag questions with `love-claude-code`

### Recognition

We believe in recognizing contributors:

- Contributors are listed in our README
- Significant contributors get special Discord roles
- We highlight contributions in release notes
- Annual contributor recognition

### Becoming a Maintainer

Active contributors may be invited to become maintainers. Maintainers:

- Have write access to the repository
- Help review and merge PRs
- Participate in project planning
- Guide the project's direction

## License

By contributing to Love Claude Code, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to ask questions! We're here to help you contribute successfully. Remember, everyone was a beginner once, and we appreciate your efforts to improve Love Claude Code.

Thank you for contributing! ❤️