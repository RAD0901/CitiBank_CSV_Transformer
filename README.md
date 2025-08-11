# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# CitiBank to Sage Bank Manager CSV Transformer

A modern web application that converts CitiBank CSV export files into the format required by Sage Bank Manager for seamless import.

## 🎯 What This Application Does

### Core Functionality
- **File Upload**: Accepts CitiBank CSV files via drag & drop or file browser
- **Data Transformation**: Converts CitiBank format to Sage Bank Manager format
- **Progress Tracking**: Real-time processing progress with detailed status updates
- **Data Preview**: Side-by-side comparison of original vs transformed data
- **File Download**: Generates properly formatted CSV for Sage Bank Manager import

### Data Transformation Details

**Input Format (CitiBank CSV):**
```
Search Criteria: ,,,
From Date: ,07/10/2025,,
To Date: ,08/08/2025,,
Accounts: ,2987066,,
"",,,
Account Number,Value Date,Customer Reference,Amount
2987066,07/31/2025,FSK ELECTRAMECOR,"1,750,000.00"
2987066,07/31/2025,20950P1FR2O," -88,433.98"
```

**Output Format (Sage Bank Manager):**
```
Date,Description,Amount
31/07/2025,FSK ELECTRAMECOR,1750000
31/07/2025,20950P1FR2O,-88434
```

### Transformation Rules
1. **Skip Metadata**: Ignore first 5 lines (Search Criteria, dates, account info, blank line)
2. **Date Format**: Convert MM/DD/YYYY → DD/MM/YYYY
3. **Amount Cleaning**: Remove quotes, spaces, commas → preserve decimal precision
4. **Description**: Use Customer Reference field, trim whitespace
5. **Remove**: Account Number column (not needed in output)

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **CSV Processing**: Papa Parse library
- **File Handling**: Browser File API
- **State Management**: React hooks (useState, useEffect, useContext)

### Component Structure
```
src/
├── components/
│   ├── FileUploadZone.tsx         # Drag & drop file upload
│   ├── ProcessingProgress.tsx      # Progress tracking UI
│   ├── DataPreview.tsx            # Before/after data comparison
│   ├── DownloadResults.tsx        # File download interface
│   └── ui/                        # shadcn/ui components
├── hooks/
│   ├── useCSVProcessor.tsx        # Core transformation logic
│   ├── useFileUpload.tsx          # File upload handling
│   └── useProgressTracking.tsx    # Progress state management
├── utils/
│   ├── csvTransformer.ts          # Core transformation functions
│   ├── fileValidator.ts           # File validation logic
│   └── constants.ts               # App constants and config
└── types/
    └── index.ts                   # TypeScript type definitions
```

### Data Flow
1. **Upload** → File validation → Extract CSV data
2. **Process** → Find transaction rows → Transform each row
3. **Preview** → Show original vs transformed data
4. **Download** → Generate output CSV → Trigger download

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with JavaScript enabled

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/citibank-csv-transformer.git
cd citibank-csv-transformer

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production
```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

### Deployment to Netlify
```bash
# Build the application
npm run build

# Or deploy automatically via GitHub integration
# See NETLIFY_DEPLOYMENT.md for complete deployment guide
```

For detailed deployment instructions, see **[NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md)**

## 🎨 UI Components

The application uses modern UI components with:
- **Responsive Design**: Mobile-first approach
- **Accessibility**: ARIA labels, keyboard navigation
- **Animations**: Smooth transitions and micro-interactions
- **Error States**: Comprehensive error handling with helpful messages
- **Progress Indicators**: Real-time feedback during processing

## 📊 Validation & Error Handling

### File Validation
- Must be .csv extension
- Maximum 10MB file size
- Must contain "Account Number" header row
- Minimum 1 transaction row required

### Data Validation
- Date format validation (MM/DD/YYYY)
- Amount must be numeric after cleaning
- Handle missing or malformed data gracefully

### Error Recovery
- Clear error messages with suggested fixes
- Option to retry processing
- Detailed error reporting for troubleshooting

## 🔧 Configuration

### Processing Settings
- Date format conversion (MM/DD/YYYY → DD/MM/YYYY)
- Amount rounding (round vs truncate)
- Error handling strategy (skip invalid rows vs stop processing)
- Output filename template

## 📁 Sample Data

### Input Sample
```csv
Account Number,Value Date,Customer Reference,Amount
2987066,07/31/2025,FSK ELECTRAMECOR,"1,750,000.00"
2987066,07/31/2025,20950P1FR2O," -88,433.98"
```

### Output Sample  
```csv
Date,Description,Amount
31/07/2025,FSK ELECTRAMECOR,1750000
31/07/2025,20950P1FR2O,-88434
```

## 🧪 Testing

### Running Tests
```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run end-to-end tests
npm run test:e2e
```

### Browser Testing
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsiveness
- File upload compatibility

## 📋 Development

### Project Structure
- Built with Vite for fast development and building
- TypeScript for type safety
- Tailwind CSS for styling
- ESLint for code quality

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run deploy` - Deploy to GitHub Pages

## 🔄 Processing Pipeline

### Step 1: File Upload (0-25%)
- Validate file format and size
- Read file contents
- Initial CSV parsing

### Step 2: Data Extraction (25-50%)
- Skip metadata rows
- Find transaction header row
- Extract transaction data

### Step 3: Data Transformation (50-75%)
- Transform each transaction row
- Date format conversion
- Amount cleaning and conversion
- Data validation

### Step 4: Output Generation (75-100%)
- Generate Sage Bank Manager CSV
- Apply final validation
- Prepare file for download

## 🎯 Success Criteria

- ✅ Handles all CitiBank CSV export formats
- ✅ 100% accurate data transformation
- ✅ Intuitive, user-friendly interface
- ✅ Comprehensive error handling
- ✅ Fast processing (< 5 seconds for typical files)
- ✅ Mobile-responsive design
- ✅ Accessibility compliant
- ✅ Production-ready deployment

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

If you encounter any issues or have questions, please [open an issue](https://github.com/yourusername/citibank-csv-transformer/issues) on GitHub.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
# CitiBank_CSV_Transformer
