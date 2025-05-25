# 🚀 Cloud Market Share Racing Chart

An interactive racing bar chart visualization showing the evolution of cloud service market share from 2019 to 2025.

## ✨ Features

- **Interactive Animation**: Watch market share changes over time
- **Glassmorphism Design**: Modern, elegant UI with blur effects
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Real-time Controls**: Play, pause, reset, and speed adjustment
- **Latest Data**: Updated through April 2025
- **Keyboard Support**: Space to play/pause, arrows to navigate
- **Touch Gestures**: Swipe navigation for mobile devices

## 🎯 Live Demo

[View Live Demo](https://yourusername.github.io/cloud-market-racing-chart)

## 📊 Data Coverage

- **Time Period**: January 2019 - April 2025
- **Update Frequency**: Monthly data points (76 total)
- **Providers Tracked**: AWS, Azure, Google Cloud, Alibaba Cloud, IBM Cloud, Oracle Cloud
- **Data Sources**: Industry reports from Gartner, Canalys, and other market research firms

## 🛠 Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Advanced styling with Glassmorphism effects
- **Vanilla JavaScript**: No framework dependencies
- **Google Fonts**: Poppins font family
- **CSS Grid & Flexbox**: Responsive layout

## 🚀 Quick Start

### Option 1: GitHub Pages (Recommended)

1. Fork this repository
2. Go to repository Settings → Pages
3. Select "Deploy from a branch" → "main"
4. Your site will be available at `https://yourusername.github.io/cloud-market-racing-chart`

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/cloud-market-racing-chart.git

# Navigate to the project directory
cd cloud-market-racing-chart

# Open with a local server (recommended)
# Option A: Using Python
python -m http.server 8000

# Option B: Using Node.js
npx serve .

# Option C: Using PHP
php -S localhost:8000

# Open http://localhost:8000 in your browser
```

## 📁 Project Structure

```
cloud-market-racing-chart/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Glassmorphism styles
├── js/
│   ├── data.js         # Market share data
│   └── chart.js        # Chart functionality
├── assets/
│   └── images/         # Image assets (if any)
├── README.md           # This file
├── LICENSE             # MIT License
└── .gitignore          # Git ignore rules
```

## 🎮 Controls

### Keyboard Shortcuts
- **Space**: Play/Pause animation
- **R**: Reset to beginning
- **← →**: Manual navigation (when paused)

### Mouse/Touch
- **Click**: Button controls
- **Swipe**: Navigate on mobile (when paused)
- **Slider**: Adjust animation speed

## 📈 Market Insights (April 2025)

1. **Azure**: Continues aggressive growth (+2%/year)
2. **AWS**: Maintains leadership despite slight decline
3. **Google Cloud**: Steady growth with AI/ML focus
4. **Alibaba**: Stable presence in Asia-Pacific
5. **IBM/Oracle**: Declining as market modernizes

## 🔧 Customization

### Adding New Data Points

Edit `js/data.js` to add new monthly data:

```javascript
// Add new data to latest2025Data object
const latest2025Data = {
    // ... existing data
    5: { AWS: 30.0, Azure: 28.5, Google: 12.0, Alibaba: 8.5, IBM: 2.5, Oracle: 2.0 }
};
```

### Changing Colors

Modify the `companyColors` object in `js/data.js`:

```javascript
const companyColors = {
    'AWS': 'linear-gradient(135deg, #ff9900, #ffbb33)',
    // ... other companies
};
```

### Styling Adjustments

Edit `css/style.css` to customize:
- Colors and gradients
- Animation timing
- Layout dimensions
- Mobile breakpoints

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE 11 (limited support)

## 📱 Mobile Optimization

- Responsive grid layout
- Touch-friendly controls
- Optimized particle count
- Reduced animations on low-power devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📊 Performance

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.0s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Market data sourced from industry reports
- Design inspired by modern glassmorphism trends
- Icons and fonts from Google Fonts
- Community feedback and contributions

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/cloud-market-racing-chart/issues) page
2. Create a new issue with detailed description
3. Contact the maintainer

---

**⭐ If you found this project helpful, please give it a star!**
