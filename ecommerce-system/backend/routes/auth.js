const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// 注册
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码至少需要6个字符'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('名字是必需的，且不能超过50个字符'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('姓氏是必需的，且不能超过50个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { email, password, firstName, lastName, phone } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }

    // 创建新用户
    const user = new User({
      email,
      password,
      profile: {
        firstName,
        lastName,
        phone
      }
    });

    await user.save();

    // 生成令牌
    const token = generateToken(user._id);

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        role: user.role
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 登录
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  body('password')
    .notEmpty()
    .withMessage('密码是必需的')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // 查找用户（包含密码字段）
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 检查账户状态
    if (user.status !== 'active') {
      return res.status(401).json({ message: '账户已被禁用' });
    }

    if (user.isLocked) {
      return res.status(401).json({ 
        message: '账户已被锁定，请稍后再试' 
      });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      return res.status(401).json({ message: '邮箱或密码错误' });
    }

    // 重置登录尝试次数
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成令牌
    const token = generateToken(user._id);

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        role: user.role
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当前用户信息
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        profile: req.user.profile,
        role: req.user.role,
        addresses: req.user.addresses,
        preferences: req.user.preferences,
        emailVerified: req.user.emailVerified,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户资料
router.put('/profile', authenticate, [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('名字不能超过50个字符'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('姓氏不能超过50个字符'),
  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('请输入有效的电话号码')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone, dateOfBirth, gender } = req.body;

    const updateData = {};
    if (firstName !== undefined) updateData['profile.firstName'] = firstName;
    if (lastName !== undefined) updateData['profile.lastName'] = lastName;
    if (phone !== undefined) updateData['profile.phone'] = phone;
    if (dateOfBirth !== undefined) updateData['profile.dateOfBirth'] = dateOfBirth;
    if (gender !== undefined) updateData['profile.gender'] = gender;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({
      message: '资料更新成功',
      user: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        role: user.role
      }
    });
  } catch (error) {
    console.error('更新资料错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 修改密码
router.put('/password', authenticate, [
  body('currentPassword')
    .notEmpty()
    .withMessage('当前密码是必需的'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('新密码至少需要6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // 获取用户（包含密码）
    const user = await User.findById(req.user._id).select('+password');

    // 验证当前密码
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: '当前密码错误' });
    }

    // 更新密码
    user.password = newPassword;
    await user.save();

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;
