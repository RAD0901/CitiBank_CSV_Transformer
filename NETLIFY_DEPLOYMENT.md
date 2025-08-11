# Netlify Deployment Guide - CitiBank CSV Transformer

## 🚀 Netlify Deployment Steps

### Step 1: Sign up for Netlify
1. Go to https://netlify.com
2. Click "Get started for free"  
3. Sign up with GitHub account (recommended for easy integration)
4. Verify your email address if prompted

### Step 2: Connect GitHub Repository
1. In Netlify dashboard, click "New site from Git"
2. Choose "GitHub" as your Git provider
3. Authorize Netlify to access your GitHub repositories
4. Select your `CitiBank_CSV_Transformer` repository from the list

### Step 3: Configure Build Settings
Netlify should auto-detect these settings from your `netlify.toml`, but verify:

**Build Settings:**
- **Branch to deploy**: `main`
- **Build command**: `npm run build`  
- **Publish directory**: `dist`
- **Node version**: `18` (automatically set from netlify.toml)

**Advanced Settings:**
- **Functions directory**: (leave empty - not needed)
- **Environment variables**: (none required for basic setup)

### Step 4: Deploy Site
1. Click "Deploy site"
2. Wait for build to complete (usually 2-3 minutes)
3. Monitor the build logs for any issues
4. Your site will get a random URL like `https://amazing-example-123456.netlify.app`

### Step 5: Customize Site Name (Recommended)
1. Go to Site settings > General > Site information
2. Click "Change site name"
3. Enter a custom name like: `citibank-csv-transformer`
4. Your final URL will be: `https://citibank-csv-transformer.netlify.app`

### Step 6: Test Your Deployment
1. Visit your new Netlify URL
2. Upload a sample CitiBank CSV file
3. Verify the transformation works correctly
4. Test the download functionality

## 🔧 Advanced Configuration

### Custom Domain Setup (Optional)
If you have your own domain:
1. Go to Site settings > Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., `csv-transformer.yourdomain.com`)
4. Follow DNS configuration instructions
5. SSL certificate will be auto-generated

### Environment Variables Setup (Future Use)
If you need environment variables later:
1. Go to Site settings > Environment variables
2. Click "Add a variable"
3. Common variables for React apps:
   - `NODE_VERSION`: `18`
   - `NPM_VERSION`: `9`
   - Any custom `VITE_` prefixed variables

## 🔄 Automatic Deployments

### Continuous Deployment
- Every push to `main` branch triggers automatic deployment
- Pull request previews are generated automatically
- Build status is shown in GitHub commits

### Deploy Contexts
Your `netlify.toml` is configured for:
- **Production**: Deploys from `main` branch
- **Branch deploys**: Preview deployments for feature branches
- **Deploy previews**: For pull requests

## 🛠️ Troubleshooting

### Build Fails
If your build fails, check:
1. **Build logs** in Netlify dashboard
2. **Node version** - should be 18+
3. **Dependencies** - run `npm install` locally first
4. **Build command** - should be `npm run build`

### Common Solutions
```bash
# If build fails locally, try:
npm install
npm run build

# Clear npm cache if needed:
npm cache clean --force
```

### Site Not Loading
1. Check if `dist` folder is being generated
2. Verify `publish directory` is set to `dist`
3. Check browser console for JavaScript errors

## 📊 Performance Monitoring

### Netlify Analytics (Optional)
1. Go to Site overview > Analytics
2. Enable Netlify Analytics for $9/month
3. Get insights on traffic, performance, and user behavior

### Core Web Vitals
Monitor your site's performance:
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms  
- **CLS (Cumulative Layout Shift)**: < 0.1

## 🔒 Security Features

Your deployment includes:
- **HTTPS by default** with automatic SSL certificates
- **Security headers** configured in netlify.toml
- **DDoS protection** built into Netlify
- **Content Security Policy** for XSS protection

## 📈 Next Steps After Deployment

1. **Test thoroughly** with various CSV files
2. **Share the URL** with intended users
3. **Monitor usage** through Netlify dashboard
4. **Set up notifications** for build failures
5. **Consider adding** Google Analytics if needed

## 🎯 Expected Results

After successful deployment:
- ✅ Site loads at your Netlify URL
- ✅ File upload works via drag & drop
- ✅ CSV transformation processes correctly
- ✅ Download generates proper Sage Bank Manager format
- ✅ Mobile responsive design works on all devices
- ✅ Fast loading times (< 3 seconds)

Your CitiBank CSV Transformer is now live and ready for production use! 🎉

---

**Need Help?** 
- Check [Netlify Documentation](https://docs.netlify.com/)
- Visit [Netlify Community Forum](https://community.netlify.com/)
- Contact support through Netlify dashboard

---

## 🌐 Deploy to Netlify

### Method 1: Netlify Dashboard (Recommended)

1. **Connect to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Sign up/Login with your GitHub account
   - Click "New site from Git"

2. **Connect Repository**
   - Choose "GitHub" as your Git provider
   - Authorize Netlify to access your repositories
   - Select `RAD0901/CitiBank_CSV_Transformer`

3. **Configure Build Settings**
   - **Branch to deploy**: `main`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - Click "Deploy site"

4. **Custom Domain (Optional)**
   - Go to Site settings → Domain management
   - Add custom domain: `citibank-csv-transformer.netlify.app`

### Method 2: Netlify CLI (Advanced)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize in your project directory
cd "c:\Users\ryadya\OneDrive - ASSA ABLOY Group\Documents\VScode Projects\Sage_Citibank_BankManager"
netlify init

# Deploy
netlify deploy --prod
```

---

## ⚙️ Configuration Details

### Build Settings
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "9"
```

### Security Headers
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Content Security Policy configured
- Cache headers for static assets

### Performance Optimizations
- Asset chunking (React, CSV, UI vendors)
- Terser minification
- Source maps for debugging
- Immutable caching for static assets

---

## 🔄 Continuous Deployment

Once connected, every push to the `main` branch will:

1. **Trigger Build** - Netlify automatically detects changes
2. **Run Tests** - Execute `npm run build`
3. **Deploy** - Publish to your live site
4. **Notify** - Get build status notifications

### Branch Previews
- Push to any branch creates a preview deployment
- Perfect for testing features before merging
- Preview URLs: `[branch-name]--[site-name].netlify.app`

---

## 📊 Post-Deployment

### Monitor Your Site
- **Build logs**: Check for any deployment issues
- **Analytics**: Monitor usage and performance
- **Forms**: Handle any form submissions (if added later)
- **Functions**: Deploy serverless functions if needed

### Site URLs
- **Production**: `https://[your-site-name].netlify.app`
- **Admin**: `https://app.netlify.com/sites/[your-site-name]`

### Environment Variables (If Needed)
```bash
# In Netlify dashboard: Site settings → Environment variables
VITE_APP_VERSION=1.0.0
VITE_API_URL=your-api-url
```

---

## 🛠️ Troubleshooting

### Common Issues

**Build Fails**
```bash
# Test build locally
npm run build

# Check build logs in Netlify dashboard
# Look for missing dependencies or TypeScript errors
```

**404 on Routes**
- Redirects configured in `netlify.toml`
- SPA routing handled automatically

**Slow Load Times**
- Check bundle size: `npm run build`
- Optimize images and assets
- Enable gzip compression (already configured)

### Support
- [Netlify Documentation](https://docs.netlify.com/)
- [GitHub Issues](https://github.com/RAD0901/CitiBank_CSV_Transformer/issues)

---

## 🎉 Success!

Your CitiBank CSV Transformer is now:
- ✅ Automatically deployed on every commit
- ✅ Secured with proper headers
- ✅ Optimized for performance
- ✅ Ready for production use

**Next Steps:**
1. Push your changes to GitHub
2. Follow the Netlify deployment steps above
3. Share your live URL!

---

*Last updated: August 11, 2025*
