import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.CMS_PORT || 3001;

// Paths
const DATA_FILE = path.join(__dirname, 'data', 'resources.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${name}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'));
    }
  },
});

// Helper functions
function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { sections: [], resources: [] };
  }
}

function writeData(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ============ API ROUTES ============

// --- Sections ---
app.get('/api/sections', (req, res) => {
  const data = readData();
  const sorted = data.sections.sort((a: any, b: any) => a.sortOrder - b.sortOrder);
  res.json(sorted);
});

app.post('/api/sections', (req, res) => {
  const data = readData();
  const newSection = {
    id: req.body.id || uuidv4(),
    title: req.body.title,
    description: req.body.description || '',
    sortOrder: req.body.sortOrder || data.sections.length,
  };
  data.sections.push(newSection);
  writeData(data);
  res.status(201).json(newSection);
});

app.put('/api/sections/:id', (req, res) => {
  const data = readData();
  const index = data.sections.findIndex((s: any) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Section not found' });
  }
  data.sections[index] = { ...data.sections[index], ...req.body };
  writeData(data);
  res.json(data.sections[index]);
});

app.delete('/api/sections/:id', (req, res) => {
  const data = readData();
  data.sections = data.sections.filter((s: any) => s.id !== req.params.id);
  writeData(data);
  res.status(204).send();
});

// --- Resources ---
app.get('/api/resources', (req, res) => {
  const data = readData();
  let resources = data.resources;

  // Filter by section if provided
  if (req.query.section) {
    resources = resources.filter((r: any) => r.section === req.query.section);
  }

  const sorted = resources.sort((a: any, b: any) => a.sortOrder - b.sortOrder);
  res.json(sorted);
});

app.get('/api/resources/:id', (req, res) => {
  const data = readData();
  const resource = data.resources.find((r: any) => r.id === req.params.id);
  if (!resource) {
    return res.status(404).json({ error: 'Resource not found' });
  }
  res.json(resource);
});

app.post('/api/resources', (req, res) => {
  const data = readData();
  const newResource = {
    id: uuidv4(),
    title: req.body.title,
    description: req.body.description || '',
    section: req.body.section,
    type: req.body.type,
    filename: req.body.filename,
    url: req.body.url,
    version: req.body.version,
    dateUpdated: req.body.dateUpdated,
    sortOrder: req.body.sortOrder || data.resources.filter((r: any) => r.section === req.body.section).length,
  };
  data.resources.push(newResource);
  writeData(data);
  res.status(201).json(newResource);
});

app.put('/api/resources/:id', (req, res) => {
  const data = readData();
  const index = data.resources.findIndex((r: any) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Resource not found' });
  }
  data.resources[index] = { ...data.resources[index], ...req.body };
  writeData(data);
  res.json(data.resources[index]);
});

app.delete('/api/resources/:id', (req, res) => {
  const data = readData();
  const resource = data.resources.find((r: any) => r.id === req.params.id);

  // Delete associated file if it's a PDF
  if (resource?.filename) {
    const filePath = path.join(UPLOADS_DIR, resource.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  data.resources = data.resources.filter((r: any) => r.id !== req.params.id);
  writeData(data);
  res.status(204).send();
});

// --- File Upload ---
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
  });
});

// --- List uploaded files ---
app.get('/api/files', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR)
      .filter(f => !f.startsWith('.'))
      .map(filename => {
        const stats = fs.statSync(path.join(UPLOADS_DIR, filename));
        return {
          filename,
          size: stats.size,
          url: `/uploads/${filename}`,
          modified: stats.mtime,
        };
      });
    res.json(files);
  } catch (error) {
    res.json([]);
  }
});

// Delete a file
app.delete('/api/files/:filename', (req, res) => {
  const filePath = path.join(UPLOADS_DIR, req.params.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Serve admin HTML from separate file
const adminHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MADiE CMS Admin</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
    .header { background: #1a4480; color: white; padding: 1rem 2rem; }
    .header h1 { font-size: 1.5rem; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .card { background: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card h2 { color: #1a4480; margin-bottom: 1rem; font-size: 1.25rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e0e0e0; }
    th { background: #f0f0f0; font-weight: 600; }
    .btn { display: inline-block; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; font-weight: 500; cursor: pointer; border: none; font-size: 0.875rem; }
    .btn-primary { background: #005ea2; color: white; }
    .btn-danger { background: #d83933; color: white; }
    .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-group input, .form-group textarea, .form-group select { width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; }
    .form-group textarea { min-height: 80px; }
    .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
    .badge-pdf { background: #fee2e2; color: #991b1b; }
    .badge-video { background: #dbeafe; color: #1e40af; }
    .badge-link { background: #d1fae5; color: #065f46; }
    .actions { display: flex; gap: 0.5rem; }
    #message { padding: 1rem; margin-bottom: 1rem; border-radius: 4px; display: none; }
    #message.success { background: #d1fae5; color: #065f46; display: block; }
    #message.error { background: #fee2e2; color: #991b1b; display: block; }
    .modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; z-index: 100; }
    .modal.active { display: flex; }
    .modal-content { background: white; padding: 2rem; border-radius: 8px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📚 MADiE CMS Admin</h1>
  </div>

  <div class="container">
    <div id="message"></div>

    <div class="card">
      <h2>📤 Upload Document</h2>
      <form id="uploadForm" enctype="multipart/form-data">
        <div class="form-group">
          <label>Select PDF or Image</label>
          <input type="file" name="file" accept=".pdf,image/*" required>
        </div>
        <button type="submit" class="btn btn-primary">Upload</button>
      </form>
    </div>

    <div class="card">
      <h2>📄 Resources</h2>
      <button class="btn btn-primary" onclick="openResourceModal()" style="margin-bottom: 1rem;">+ Add Resource</button>
      <table>
        <thead>
          <tr><th>Title</th><th>Section</th><th>Type</th><th>Actions</th></tr>
        </thead>
        <tbody id="resourcesTable"></tbody>
      </table>
    </div>

    <div class="card">
      <h2>📁 Uploaded Files</h2>
      <table>
        <thead>
          <tr><th>Filename</th><th>Size</th><th>Actions</th></tr>
        </thead>
        <tbody id="filesTable"></tbody>
      </table>
    </div>
  </div>

  <div id="resourceModal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="modalTitle">Add Resource</h3>
        <button class="modal-close" onclick="closeResourceModal()">&times;</button>
      </div>
      <form id="resourceForm">
        <input type="hidden" id="resourceId">
        <div class="form-group">
          <label>Title *</label>
          <input type="text" id="resourceTitle" required>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea id="resourceDescription"></textarea>
        </div>
        <div class="form-group">
          <label>Section *</label>
          <select id="resourceSection" required>
            <option value="user-guides">User Guides</option>
            <option value="video-tutorials">Video Tutorials</option>
            <option value="release-notes">Release Notes</option>
            <option value="additional-resources">Additional Resources</option>
          </select>
        </div>
        <div class="form-group">
          <label>Type *</label>
          <select id="resourceType" required onchange="toggleFields()">
            <option value="pdf">PDF Document</option>
            <option value="video">Video</option>
            <option value="link">External Link</option>
          </select>
        </div>
        <div class="form-group" id="filenameGroup">
          <label>Filename (from uploaded files)</label>
          <select id="resourceFilename"><option value="">Select a file...</option></select>
        </div>
        <div class="form-group" id="urlGroup" style="display:none;">
          <label>URL</label>
          <input type="url" id="resourceUrl">
        </div>
        <div class="form-group" id="versionGroup">
          <label>Version</label>
          <input type="text" id="resourceVersion" placeholder="e.g., 3.0">
        </div>
        <div class="form-group">
          <label>Date Updated</label>
          <input type="text" id="resourceDateUpdated" placeholder="e.g., March 2024">
        </div>
        <button type="submit" class="btn btn-primary">Save</button>
      </form>
    </div>
  </div>

  <script>
    const API = '';

    function showMessage(text, type) {
      const msg = document.getElementById('message');
      msg.textContent = text;
      msg.className = type;
      setTimeout(() => msg.className = '', 3000);
    }

    async function loadResources() {
      const res = await fetch(API + '/api/resources');
      const resources = await res.json();
      const tbody = document.getElementById('resourcesTable');
      tbody.innerHTML = resources.map(r =>
        '<tr><td>' + r.title + '</td><td>' + r.section + '</td><td><span class="badge badge-' + r.type + '">' + r.type.toUpperCase() + '</span></td><td class="actions"><button class="btn btn-primary btn-sm" onclick="editResource(\\'' + r.id + '\\')">Edit</button> <button class="btn btn-danger btn-sm" onclick="deleteResource(\\'' + r.id + '\\')">Delete</button></td></tr>'
      ).join('');
    }

    async function loadFiles() {
      const res = await fetch(API + '/api/files');
      const files = await res.json();
      const tbody = document.getElementById('filesTable');
      tbody.innerHTML = files.map(f =>
        '<tr><td><a href="/uploads/' + f.filename + '" target="_blank">' + f.filename + '</a></td><td>' + (f.size / 1024).toFixed(1) + ' KB</td><td class="actions"><button class="btn btn-danger btn-sm" onclick="deleteFile(\\'' + f.filename + '\\')">Delete</button></td></tr>'
      ).join('');

      const select = document.getElementById('resourceFilename');
      select.innerHTML = '<option value="">Select a file...</option>' + files.map(f => '<option value="' + f.filename + '">' + f.filename + '</option>').join('');
    }

    document.getElementById('uploadForm').onsubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const res = await fetch(API + '/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        showMessage('File uploaded successfully!', 'success');
        e.target.reset();
        loadFiles();
      } else {
        showMessage('Upload failed', 'error');
      }
    };

    function toggleFields() {
      const type = document.getElementById('resourceType').value;
      document.getElementById('filenameGroup').style.display = type === 'pdf' ? 'block' : 'none';
      document.getElementById('urlGroup').style.display = type !== 'pdf' ? 'block' : 'none';
      document.getElementById('versionGroup').style.display = type === 'pdf' ? 'block' : 'none';
    }

    function openResourceModal(resource) {
      document.getElementById('modalTitle').textContent = resource ? 'Edit Resource' : 'Add Resource';
      document.getElementById('resourceId').value = resource ? resource.id : '';
      document.getElementById('resourceTitle').value = resource ? resource.title : '';
      document.getElementById('resourceDescription').value = resource ? resource.description : '';
      document.getElementById('resourceSection').value = resource ? resource.section : 'user-guides';
      document.getElementById('resourceType').value = resource ? resource.type : 'pdf';
      document.getElementById('resourceFilename').value = resource ? (resource.filename || '') : '';
      document.getElementById('resourceUrl').value = resource ? (resource.url || '') : '';
      document.getElementById('resourceVersion').value = resource ? (resource.version || '') : '';
      document.getElementById('resourceDateUpdated').value = resource ? (resource.dateUpdated || '') : '';
      toggleFields();
      document.getElementById('resourceModal').classList.add('active');
    }

    function closeResourceModal() {
      document.getElementById('resourceModal').classList.remove('active');
    }

    async function editResource(id) {
      const res = await fetch(API + '/api/resources/' + id);
      const resource = await res.json();
      openResourceModal(resource);
    }

    async function deleteResource(id) {
      if (!confirm('Delete this resource?')) return;
      await fetch(API + '/api/resources/' + id, { method: 'DELETE' });
      showMessage('Resource deleted', 'success');
      loadResources();
    }

    async function deleteFile(filename) {
      if (!confirm('Delete this file?')) return;
      await fetch(API + '/api/files/' + filename, { method: 'DELETE' });
      showMessage('File deleted', 'success');
      loadFiles();
    }

    document.getElementById('resourceForm').onsubmit = async (e) => {
      e.preventDefault();
      const id = document.getElementById('resourceId').value;
      const data = {
        title: document.getElementById('resourceTitle').value,
        description: document.getElementById('resourceDescription').value,
        section: document.getElementById('resourceSection').value,
        type: document.getElementById('resourceType').value,
        filename: document.getElementById('resourceFilename').value,
        url: document.getElementById('resourceUrl').value,
        version: document.getElementById('resourceVersion').value,
        dateUpdated: document.getElementById('resourceDateUpdated').value,
      };

      const res = await fetch(API + '/api/resources' + (id ? '/' + id : ''), {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        showMessage('Resource saved!', 'success');
        closeResourceModal();
        loadResources();
      } else {
        showMessage('Save failed', 'error');
      }
    };

    loadResources();
    loadFiles();
  </script>
</body>
</html>`;

app.get('/admin', (req, res) => {
  res.send(adminHTML);
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║         MADiE CMS Server Running               ║
╠════════════════════════════════════════════════╣
║  Admin UI:  http://localhost:${PORT}/admin       ║
║  API:       http://localhost:${PORT}/api         ║
╚════════════════════════════════════════════════╝
  `);
});

