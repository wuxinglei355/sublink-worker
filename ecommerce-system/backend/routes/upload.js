const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 配置 Multer
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(',');
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  },
});

// 上传单个图片
router.post('/image', requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的图片' });
    }

    const { folder = 'general' } = req.body;

    // 上传到 Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `wayrumble/${folder}`,
          resource_type: 'image',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({
      message: '图片上传成功',
      image: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes
      }
    });
  } catch (error) {
    console.error('图片上传错误:', error);
    
    if (error.message === '不支持的文件类型') {
      return res.status(400).json({ message: error.message });
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小超出限制' });
    }
    
    res.status(500).json({ message: '图片上传失败' });
  }
});

// 上传多个图片
router.post('/images', requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '请选择要上传的图片' });
    }

    const { folder = 'general' } = req.body;
    const uploadPromises = [];

    // 并行上传所有图片
    for (const file of req.files) {
      const uploadPromise = new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: `wayrumble/${folder}`,
            resource_type: 'image',
            transformation: [
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve({
              url: result.secure_url,
              publicId: result.public_id,
              width: result.width,
              height: result.height,
              format: result.format,
              size: result.bytes
            });
          }
        ).end(file.buffer);
      });
      
      uploadPromises.push(uploadPromise);
    }

    const images = await Promise.all(uploadPromises);

    res.json({
      message: '图片上传成功',
      images
    });
  } catch (error) {
    console.error('批量图片上传错误:', error);
    
    if (error.message === '不支持的文件类型') {
      return res.status(400).json({ message: error.message });
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小超出限制' });
    }
    
    res.status(500).json({ message: '图片上传失败' });
  }
});

// 删除图片
router.delete('/image/:publicId', requireAdmin, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // 解码 publicId（因为URL中的斜杠会被编码）
    const decodedPublicId = decodeURIComponent(publicId);
    
    const result = await cloudinary.uploader.destroy(decodedPublicId);
    
    if (result.result === 'ok') {
      res.json({ message: '图片删除成功' });
    } else {
      res.status(404).json({ message: '图片未找到或已被删除' });
    }
  } catch (error) {
    console.error('删除图片错误:', error);
    res.status(500).json({ message: '删除图片失败' });
  }
});

// 获取图片信息
router.get('/image/:publicId', requireAdmin, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // 解码 publicId
    const decodedPublicId = decodeURIComponent(publicId);
    
    const result = await cloudinary.api.resource(decodedPublicId);
    
    res.json({
      image: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
        createdAt: result.created_at
      }
    });
  } catch (error) {
    console.error('获取图片信息错误:', error);
    
    if (error.http_code === 404) {
      return res.status(404).json({ message: '图片未找到' });
    }
    
    res.status(500).json({ message: '获取图片信息失败' });
  }
});

// 获取文件夹中的所有图片
router.get('/folder/:folderName', requireAdmin, async (req, res) => {
  try {
    const { folderName } = req.params;
    const { maxResults = 50, nextCursor } = req.query;
    
    const options = {
      type: 'upload',
      prefix: `wayrumble/${folderName}/`,
      max_results: parseInt(maxResults),
      resource_type: 'image'
    };
    
    if (nextCursor) {
      options.next_cursor = nextCursor;
    }
    
    const result = await cloudinary.api.resources(options);
    
    const images = result.resources.map(resource => ({
      url: resource.secure_url,
      publicId: resource.public_id,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      size: resource.bytes,
      createdAt: resource.created_at
    }));
    
    res.json({
      images,
      nextCursor: result.next_cursor,
      totalCount: result.total_count
    });
  } catch (error) {
    console.error('获取文件夹图片错误:', error);
    res.status(500).json({ message: '获取图片列表失败' });
  }
});

// 图片变换（生成不同尺寸的图片）
router.post('/transform', requireAdmin, async (req, res) => {
  try {
    const { publicId, transformations } = req.body;
    
    if (!publicId || !transformations) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    // 生成变换后的URL
    const transformedUrl = cloudinary.url(publicId, {
      ...transformations,
      secure: true
    });
    
    res.json({
      message: '图片变换成功',
      originalUrl: cloudinary.url(publicId, { secure: true }),
      transformedUrl
    });
  } catch (error) {
    console.error('图片变换错误:', error);
    res.status(500).json({ message: '图片变换失败' });
  }
});

// 错误处理中间件
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: '文件大小超出限制' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: '文件数量超出限制' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: '意外的文件字段' });
    }
  }
  
  if (error.message === '不支持的文件类型') {
    return res.status(400).json({ message: error.message });
  }
  
  console.error('文件上传错误:', error);
  res.status(500).json({ message: '文件处理失败' });
});

module.exports = router;
