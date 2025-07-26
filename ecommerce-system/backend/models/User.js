const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, '邮箱是必需的'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码是必需的'],
    minlength: [6, '密码至少需要6个字符'],
    select: false // 默认查询时不返回密码
  },
  profile: {
    firstName: {
      type: String,
      required: [true, '名字是必需的'],
      trim: true,
      maxlength: [50, '名字不能超过50个字符']
    },
    lastName: {
      type: String,
      required: [true, '姓氏是必需的'],
      trim: true,
      maxlength: [50, '姓氏不能超过50个字符']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, '请输入有效的电话号码']
    },
    avatar: {
      url: String,
      alt: String
    },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    }
  },
  addresses: [{
    type: {
      type: String,
      enum: ['billing', 'shipping', 'both'],
      default: 'both'
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    company: {
      type: String,
      trim: true
    },
    address1: {
      type: String,
      required: true,
      trim: true
    },
    address2: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    zipCode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'US'
    },
    phone: {
      type: String,
      trim: true
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  role: {
    type: String,
    enum: ['customer', 'admin', 'super_admin'],
    default: 'customer'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  preferences: {
    newsletter: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'zh-CN',
      enum: ['zh-CN', 'en-US', 'es-ES']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'CNY', 'EUR']
    }
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// 虚拟字段：全名
userSchema.virtual('profile.fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// 虚拟字段：是否被锁定
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// 索引
userSchema.index({ email: 1 });
userSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });
userSchema.index({ role: 1, status: 1 });

// 中间件：保存前加密密码
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 实例方法：验证密码
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 实例方法：增加登录尝试次数
userSchema.methods.incLoginAttempts = function() {
  // 如果之前有锁定且已过期，重置计数器
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // 如果达到最大尝试次数且未被锁定，则锁定账户
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 锁定2小时
  }
  
  return this.updateOne(updates);
};

// 实例方法：重置登录尝试
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

module.exports = mongoose.model('User', userSchema);
