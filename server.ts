import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import crypto from 'crypto';
import { google } from "googleapis";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';


  // Google Sheets API Setup
  const getSheetsClient = () => {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!email || !privateKey || !sheetId) {
      throw new Error('Missing Google Sheets credentials in environment variables.');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return { sheets, sheetId };
  };


  // Admin Middleware
  const requireAdmin = (req: any, res: any, next: any) => {
    const token = req.cookies.admin_session;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.admin = decoded;
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid session" });
    }
  };

  // Simple Auth Route
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedUsername || !expectedPassword) {
      return res.status(500).json({ error: "Server authentication not configured." });
    }

    if (username === expectedUsername && password === expectedPassword) {
      const token = jwt.sign({ role: 'admin', username }, JWT_SECRET, { expiresIn: '8h' });
      
      res.cookie('admin_session', token, {
        secure: true,
        sameSite: 'none',
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000
      });

      return res.json({ success: true });
    }

    return res.status(401).json({ error: "Invalid credentials" });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('admin_session', { secure: true, sameSite: 'none', httpOnly: true });
    res.json({ success: true });
  });

  app.get('/api/admin/session', requireAdmin, (req: any, res) => {
    res.json({ user: req.admin });
  });

  app.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
    try {
      const client = getSheetsClient();
      const sheets = client.sheets;
      const sheetId = client.sheetId;

      const [categoriesRes, productsRes] = await Promise.all([
        sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: "Categories!A2:E" }),
        sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: "Products!A2:F" })
      ]);

      const isRowActive = (status) => {
        if (!status) return false;
        const s = status.toString().toLowerCase().trim();
        return s === 'active' || s === 'enabled' || s === 'true' || s === 'yes' || s === '1';
      };

      const categoriesCount = (categoriesRes.data.values || []).length;
      const allProducts = productsRes.data.values || [];
      const productsCount = allProducts.length;
      const activeProductsCount = allProducts.filter(row => isRowActive(row[5])).length;

      res.json({ categoriesCount, productsCount, activeProductsCount });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  });


  // Admin Categories Management Routes
  app.get('/api/admin/categories', requireAdmin, async (req, res) => {
    try {
      const client = getSheetsClient();
      const response = await client.sheets.spreadsheets.values.get({
        spreadsheetId: client.sheetId,
        range: "Categories!A2:E"
      });
      const rows = response.data.values || [];
      const categories = rows.map((row) => ({
        id: row[0],
        name: row[1] || '',
        image: row[2] || '',
        status: row[3] || 'Inactive',
        displayOrder: parseInt(row[4] || '0', 10) || 0
      })).filter(c => c.id);
      res.json({ categories });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/categories', requireAdmin, async (req, res) => {
    try {
      const { name, image, status, displayOrder } = req.body;
      if (!name) return res.status(400).json({ error: "Category name is required" });
      
      const client = getSheetsClient();
      const id = crypto.randomUUID();
      
      await client.sheets.spreadsheets.values.append({
        spreadsheetId: client.sheetId,
        range: "Categories!A:E",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[id, name, image || '', status || 'Active', displayOrder || 0]]
        }
      });
      
      res.json({ success: true, category: { id, name, image, status, displayOrder } });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/admin/categories/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, image, status, displayOrder } = req.body;
      if (!name) return res.status(400).json({ error: "Category name is required" });
      
      const client = getSheetsClient();
      
      const response = await client.sheets.spreadsheets.values.get({
        spreadsheetId: client.sheetId,
        range: "Categories!A2:E"
      });
      const rows = response.data.values || [];
      const rowIndex = rows.findIndex(row => row[0] === id);
      
      if (rowIndex === -1) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      const actualRowNumber = rowIndex + 2;
      
      await client.sheets.spreadsheets.values.update({
        spreadsheetId: client.sheetId,
        range: `Categories!A${actualRowNumber}:E${actualRowNumber}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[id, name, image || '', status || 'Inactive', displayOrder || 0]]
        }
      });
      
      res.json({ success: true });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });



  // Admin Products Management Routes
  app.get('/api/admin/products', requireAdmin, async (req, res) => {
    try {
      const client = getSheetsClient();
      
      const [productsRes, detailsRes, imagesRes] = await Promise.all([
        client.sheets.spreadsheets.values.get({ spreadsheetId: client.sheetId, range: "Products!A2:F" }),
        client.sheets.spreadsheets.values.get({ spreadsheetId: client.sheetId, range: "Product Details!A2:D" }),
        client.sheets.spreadsheets.values.get({ spreadsheetId: client.sheetId, range: "Product Images!A2:D" }).catch(() => ({ data: { values: [] } }))
      ]);
      
      const detailsRows = detailsRes.data.values || [];
      const imagesRows = imagesRes.data.values || [];
      const imagesMap = {};
      imagesRows.forEach(row => {
        const [imgId, prodId, url, order] = row;
        if (imgId && prodId && url) {
          if (!imagesMap[prodId]) imagesMap[prodId] = [];
          imagesMap[prodId].push({ id: imgId, url, displayOrder: parseInt(order || '0', 10) });
        }
      });
      // Sort images by displayOrder
      for (const prodId in imagesMap) {
        imagesMap[prodId].sort((a, b) => a.displayOrder - b.displayOrder);
      }
      const detailsMap = {};
      detailsRows.forEach(row => {
        const detailId = row[0];
        const prodId = row[1];
        const label = row[2];
        const value = row[3];
        if (detailId && prodId && label && value) {
          if (!detailsMap[prodId]) detailsMap[prodId] = [];
          detailsMap[prodId].push({ id: detailId, name: label, value: value });
        }
      });

      const rows = productsRes.data.values || [];
      const products = rows.map((row) => ({
        id: row[0],
        categoryId: row[1] || '',
        name: row[2] || '',
        description: row[3] || '',
        image: row[4] || '',
        status: row[5] || 'Inactive',
        customFields: detailsMap[row[0]] || [],
        images: imagesMap[row[0]] || []
      })).filter(p => p.id);
      res.json({ products });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/products', requireAdmin, async (req, res) => {
    try {
      const { categoryId, name, description, image, status, customFields, images } = req.body;
      if (!name || !categoryId) return res.status(400).json({ error: "Name and Category are required" });
      
      const client = getSheetsClient();
      const id = crypto.randomUUID();
      
      await client.sheets.spreadsheets.values.append({
        spreadsheetId: client.sheetId,
        range: "Products!A:F",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[id, categoryId, name, description || '', image || '', status || 'Active']]
        }
      });

      if (customFields && customFields.length > 0) {
        const detailValues = customFields.map(f => [crypto.randomUUID(), id, f.label || f.name, f.value]);
        await client.sheets.spreadsheets.values.append({
          spreadsheetId: client.sheetId,
          range: "Product Details!A:D",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: detailValues }
        });
      }
      if (images && images.length > 0) {
        const imageValues = images.map(img => [crypto.randomUUID(), id, img.url, img.displayOrder || 0]);
        await client.sheets.spreadsheets.values.append({
          spreadsheetId: client.sheetId,
          range: "Product Images!A:D",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: imageValues }
        }).catch(e => console.error('Error saving product images:', e));
      }
      
      res.json({ success: true, product: { id, categoryId, name, description, image, status, customFields, images } });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { categoryId, name, description, image, status, customFields, images } = req.body;
      if (!name || !categoryId) return res.status(400).json({ error: "Name and Category are required" });
      
      const client = getSheetsClient();
      
      // Update Product
      const prodRes = await client.sheets.spreadsheets.values.get({
        spreadsheetId: client.sheetId,
        range: "Products!A2:F"
      });
      const prodRows = prodRes.data.values || [];
      const prodRowIndex = prodRows.findIndex(row => row[0] === id);
      
      if (prodRowIndex === -1) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      await client.sheets.spreadsheets.values.update({
        spreadsheetId: client.sheetId,
        range: `Products!A${prodRowIndex + 2}:F${prodRowIndex + 2}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[id, categoryId, name, description || '', image || '', status || 'Inactive']]
        }
      });

      // Update Product Details
      if (customFields) {
        const detailsRes = await client.sheets.spreadsheets.values.get({
          spreadsheetId: client.sheetId,
          range: "Product Details!A2:D"
        });
        const allDetails = detailsRes.data.values || [];
        
        // Find existing rows for this product
        const existingIndices = [];
        allDetails.forEach((row, idx) => {
          if (row[1] === id) {
            existingIndices.push(idx);
          }
        });

        const newDetails = customFields;
        const updates = [];
        const appends = [];

        // Match existing indices to new details
        for (let i = 0; i < Math.max(existingIndices.length, newDetails.length); i++) {
          if (i < existingIndices.length && i < newDetails.length) {
            // Overwrite existing row
            const rowIndex = existingIndices[i] + 2;
            const detail = newDetails[i];
            const detailId = allDetails[existingIndices[i]][0] || crypto.randomUUID();
            updates.push({
              range: `Product Details!A${rowIndex}:D${rowIndex}`,
              values: [[detailId, id, detail.label || detail.name, detail.value]]
            });
          } else if (i < existingIndices.length) {
            // Blank out deleted row
            const rowIndex = existingIndices[i] + 2;
            updates.push({
              range: `Product Details!A${rowIndex}:D${rowIndex}`,
              values: [['', '', '', '']]
            });
          } else {
            // Append new row
            const detail = newDetails[i];
            appends.push([crypto.randomUUID(), id, detail.label || detail.name, detail.value]);
          }
        }

        // Apply updates
        if (updates.length > 0) {
          await client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: client.sheetId,
            requestBody: {
              valueInputOption: "USER_ENTERED",
              data: updates
            }
          });
        }
        
        // Apply appends
        if (appends.length > 0) {
          await client.sheets.spreadsheets.values.append({
            spreadsheetId: client.sheetId,
            range: "Product Details!A:D",
            valueInputOption: "USER_ENTERED",
            requestBody: { values: appends }
          });
        }
      }

      // Update Product Images
      if (images) {
        let allImages = [];
        try {
          const imgRes = await client.sheets.spreadsheets.values.get({
            spreadsheetId: client.sheetId,
            range: "Product Images!A2:D"
          });
          allImages = imgRes.data.values || [];
        } catch (err) {
          console.warn("Product Images sheet might not exist yet", err.message);
        }
        
        const existingImgIndices = [];
        allImages.forEach((row, idx) => {
          if (row[1] === id) existingImgIndices.push(idx);
        });

        const newImages = images;
        const imgUpdates = [];
        const imgAppends = [];

        for (let i = 0; i < Math.max(existingImgIndices.length, newImages.length); i++) {
          if (i < existingImgIndices.length && i < newImages.length) {
            const rowIndex = existingImgIndices[i] + 2;
            const img = newImages[i];
            const imgId = allImages[existingImgIndices[i]][0] || crypto.randomUUID();
            imgUpdates.push({
              range: `Product Images!A${rowIndex}:D${rowIndex}`,
              values: [[imgId, id, img.url, img.displayOrder || 0]]
            });
          } else if (i < existingImgIndices.length) {
            const rowIndex = existingImgIndices[i] + 2;
            imgUpdates.push({
              range: `Product Images!A${rowIndex}:D${rowIndex}`,
              values: [['', '', '', '']]
            });
          } else {
            const img = newImages[i];
            imgAppends.push([crypto.randomUUID(), id, img.url, img.displayOrder || 0]);
          }
        }

        if (imgUpdates.length > 0) {
          await client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: client.sheetId,
            requestBody: {
              valueInputOption: "USER_ENTERED",
              data: imgUpdates
            }
          }).catch(e => console.error(e));
        }
        
        if (imgAppends.length > 0) {
          await client.sheets.spreadsheets.values.append({
            spreadsheetId: client.sheetId,
            range: "Product Images!A:D",
            valueInputOption: "USER_ENTERED",
            requestBody: { values: imgAppends }
          }).catch(e => console.error(e));
        }
      }

      
      res.json({ success: true });
    } catch(e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  // API Routes


  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/catalog", async (req, res) => {
    try {
      const client = getSheetsClient();
      const sheets = client.sheets;
      const sheetId = client.sheetId;

      // Fetch all three sheets concurrently (skipping header row A1)
      const [categoriesRes, productsRes, detailsRes, imagesRes] = await Promise.all([
        sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: "Categories!A2:E" }),
        sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: "Products!A2:F" }),
        sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: "Product Details!A2:D" }),
        sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: "Product Images!A2:D" }).catch(() => ({ data: { values: [] } }))
      ]);

      const isRowActive = (status: string) => {
        if (!status) return false;
        const s = status.toString().toLowerCase().trim();
        return s === 'active' || s === 'enabled' || s === 'true' || s === 'yes' || s === '1';
      };

      const categoriesRows = categoriesRes.data.values || [];
      const productsRows = productsRes.data.values || [];
      const detailsRows = detailsRes.data.values || [];

      // Parse Categories
      const categories = categoriesRows
        .map(row => ({
          id: row[0],
          name: row[1],
          image: row[2] || '',
          isActive: isRowActive(row[3]),
          displayOrder: parseInt(row[4] || '0', 10) || 0
        }))
        .filter(c => c.isActive && c.id);

      const activeCategoryIds = new Set(categories.map(c => c.id));

      const imagesRows = imagesRes.data.values || [];
      // Parse Product Images
      const imagesByProduct: Record<string, {id: string, url: string, displayOrder: number}[]> = {};
      imagesRows.forEach(row => {
        const [imgId, prodId, url, order] = row;
        if (imgId && prodId && url) {
          if (!imagesByProduct[prodId]) imagesByProduct[prodId] = [];
          imagesByProduct[prodId].push({ id: imgId, url, displayOrder: parseInt(order || '0', 10) });
        }
      });
      for (const prodId in imagesByProduct) {
        imagesByProduct[prodId].sort((a, b) => a.displayOrder - b.displayOrder);
      }

      // Parse Product Details
      const detailsByProduct: Record<string, {name: string, value: string}[]> = {};
      detailsRows.forEach(row => {
        const productId = row[1];
        if (productId && row[2] && row[3]) {
          if (!detailsByProduct[productId]) detailsByProduct[productId] = [];
          detailsByProduct[productId].push({ name: row[2], value: row[3] });
        }
      });

      // Parse Products
      const products = productsRows
        .map(row => ({
          id: row[0],
          categoryId: row[1],
          name: row[2],
          description: row[3] || '',
          image: row[4] || '',
          isActive: isRowActive(row[5]),
          customFields: detailsByProduct[row[0]] || [],
          images: imagesByProduct[row[0]] || []
        }))
        .filter(p => p.isActive && activeCategoryIds.has(p.categoryId) && p.id);

      res.json({ categories, products });
    } catch (error: any) {
      console.error("Catalog Fetch Error:", error);
      res.status(500).json({ error: "Failed to fetch catalog data. Please check connection." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
