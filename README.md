# 📍 Location Manager

A powerful Progressive Web App (PWA) that extracts EXIF data from photos, including GPS coordinates, camera settings, and astronomical data. Perfect for photographers, travelers, and anyone who wants to analyze their photo metadata.

## ✨ Features

### 📸 Photo Analysis
- **Multiple file upload** - Upload single or multiple photos at once
- **EXIF data extraction** - Comprehensive metadata parsing
- **HEIC/HEIF support** - Native support for Apple's image format
- **Real-time preview** - Instant image preview with data analysis

### 🗺️ Location Services
- **GPS coordinates** - Extract precise location data
- **Reverse geocoding** - Convert coordinates to readable addresses
- **Google Maps integration** - Direct links to photo locations
- **Altitude information** - Elevation data when available

### ☀️ Astronomical Data
- **Sun calculations** - Sunrise, sunset, and solar noon times
- **Day length** - Duration of daylight hours
- **Sun position** - Azimuth and altitude at photo time
- **Day/night detection** - Automatic daytime/nighttime classification

### 📊 Comprehensive EXIF Data
- **Camera information** - Make, model, and software details
- **Exposure settings** - Aperture, shutter speed, ISO, focal length
- **Date & time** - Original capture timestamp
- **Image properties** - Dimensions, resolution, orientation
- **Technical settings** - Flash, white balance, metering mode

### 📄 Export & Reporting
- **PDF generation** - Professional reports with photos and data
- **Custom titles** - Editable photo titles with address placeholders
- **Data filtering** - Show/hide specific data categories
- **Zip downloads** - PDF + individual renamed images
- **Clickable links** - Interactive Google Maps links in PDF

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/andreaperaltro/location.git
   cd location
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **EXIF Processing**: exifr library
- **HEIC Support**: heic-to library
- **Astronomical Calculations**: suncalc library
- **PDF Generation**: jsPDF
- **Zip Creation**: JSZip
- **Geocoding**: OpenStreetMap Nominatim API

## 📱 Usage

### Upload Photos
1. **Drag & drop** images onto the upload area
2. **Click to browse** and select multiple files
3. **Supported formats**: JPEG, PNG, HEIC, HEIF, and more

### View Data
- **Collapsible sections** - Organize data by category
- **Filter controls** - Show/hide specific data types
- **Editable titles** - Customize photo names
- **Interactive maps** - Click to view locations

### Export Reports
1. **Customize settings** - Set report title and description
2. **Filter data** - Choose which information to include
3. **Export PDF** - Generate professional reports
4. **Download zip** - Get PDF + individual images

## 🎯 Key Components

### Photo Upload (`PhotoUpload.tsx`)
- Handles file selection and drag-and-drop
- Converts HEIC files to JPEG for preview
- Processes multiple files simultaneously

### EXIF Display (`EXIFDisplay.tsx`)
- Collapsible data sections
- Inline title editing
- Interactive Google Maps links
- Filtered data display

### Data Filter (`DataFilter.tsx`)
- Toggle data categories on/off
- Bulk select/deselect options
- Real-time filter updates

### PDF Export (`pdfExport.ts`)
- Professional report generation
- Image embedding and layout
- Clickable links and formatting
- Zip file creation with renamed images

## 🔧 Configuration

### Environment Variables
No environment variables required - the app works out of the box!

### Customization
- **Report settings** - Customize PDF title and description
- **Data filters** - Control which information appears
- **Photo titles** - Edit individual photo names

## 📦 Dependencies

### Core Libraries
- `next` - React framework
- `react` - UI library
- `typescript` - Type safety

### EXIF & Image Processing
- `exifr` - EXIF data extraction
- `heic-to` - HEIC file conversion
- `suncalc` - Astronomical calculations

### PDF & Export
- `jspdf` - PDF generation
- `jszip` - Zip file creation

### UI & Styling
- `tailwindcss` - CSS framework
- `@radix-ui/*` - UI primitives
- `lucide-react` - Icons

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Deploy automatically on every push
3. Custom domain configuration available

### Other Platforms
- **Netlify** - Static site hosting
- **Railway** - Full-stack deployment
- **Docker** - Containerized deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **exifr** - Modern EXIF data parsing
- **suncalc** - Astronomical calculations
- **OpenStreetMap** - Geocoding services
- **Radix UI** - Accessible UI components
- **Tailwind CSS** - Utility-first styling

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/andreaperaltro/location/issues) page
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

---

**Built with ❤️ for photographers and location enthusiasts**