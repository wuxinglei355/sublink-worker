import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FiFacebook, 
  FiInstagram, 
  FiTwitter, 
  FiMail, 
  FiPhone, 
  FiMapPin,
  FiCreditCard,
  FiShield,
  FiTruck
} from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    products: [
      { name: '画布印刷', href: '/category/canvas' },
      { name: '马克杯', href: '/category/mug' },
      { name: '装饰品', href: '/category/ornament' },
      { name: '项链', href: '/category/necklace' },
      { name: '服装', href: '/category/apparel' },
      { name: '毯子', href: '/category/blanket' },
    ],
    collections: [
      { name: '宗教系列', href: '/collections/jesus' },
      { name: '家庭系列', href: '/collections/family' },
      { name: '宠物系列', href: '/collections/pets' },
      { name: '纪念礼品', href: '/collections/memorial' },
      { name: '情侣系列', href: '/collections/couple' },
      { name: '节日系列', href: '/collections/holiday' },
    ],
    support: [
      { name: '帮助中心', href: '/help' },
      { name: '订单跟踪', href: '/track-order' },
      { name: '退换政策', href: '/returns' },
      { name: '尺寸指南', href: '/size-guide' },
      { name: '常见问题', href: '/faq' },
      { name: '联系我们', href: '/contact' },
    ],
    company: [
      { name: '关于我们', href: '/about' },
      { name: '隐私政策', href: '/privacy' },
      { name: '服务条款', href: '/terms' },
      { name: '配送信息', href: '/shipping' },
      { name: '批发合作', href: '/wholesale' },
      { name: '加盟合作', href: '/partnership' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', icon: FiFacebook, href: '#' },
    { name: 'Instagram', icon: FiInstagram, href: '#' },
    { name: 'Twitter', icon: FiTwitter, href: '#' },
  ];

  const features = [
    {
      icon: FiTruck,
      title: '免费配送',
      description: '订单满$50免费配送'
    },
    {
      icon: FiShield,
      title: '品质保证',
      description: '100%满意保证'
    },
    {
      icon: FiCreditCard,
      title: '安全支付',
      description: '多种支付方式'
    },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* 特色服务 */}
      <div className="border-b border-gray-800">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* 品牌信息 */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">W</span>
              </div>
              <span className="text-2xl font-serif font-bold">WayRumble</span>
            </Link>
            
            <p className="text-gray-400 mb-6 leading-relaxed">
              专业的个性化定制礼品平台，为您提供高品质的画布印刷、马克杯、装饰品等产品。
              让每一份礼物都承载着您的心意和故事。
            </p>
            
            {/* 联系信息 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FiMapPin className="w-5 h-5 text-primary-400" />
                <span className="text-gray-400">1300 Rosa Parks Blvd. Detroit, MI 48216, USA</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiPhone className="w-5 h-5 text-primary-400" />
                <span className="text-gray-400">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiMail className="w-5 h-5 text-primary-400" />
                <span className="text-gray-400">support@wayrumble.com</span>
              </div>
            </div>
          </div>

          {/* 产品分类 */}
          <div>
            <h3 className="font-semibold text-lg mb-6">产品分类</h3>
            <ul className="space-y-3">
              {footerLinks.products.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 热门系列 */}
          <div>
            <h3 className="font-semibold text-lg mb-6">热门系列</h3>
            <ul className="space-y-3">
              {footerLinks.collections.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 客户支持 */}
          <div>
            <h3 className="font-semibold text-lg mb-6">客户支持</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 公司信息 */}
          <div>
            <h3 className="font-semibold text-lg mb-6">公司信息</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 邮件订阅 */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="max-w-md">
            <h3 className="font-semibold text-lg mb-4">订阅我们的邮件</h3>
            <p className="text-gray-400 mb-4">
              获取最新产品信息和独家优惠
            </p>
            <form className="flex space-x-2">
              <input
                type="email"
                placeholder="输入您的邮箱地址"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-white placeholder-gray-400"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
              >
                订阅
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* 版权信息 */}
            <div className="text-gray-400 text-sm">
              © {currentYear} WayRumble. 保留所有权利。
            </div>

            {/* 社交媒体链接 */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">关注我们:</span>
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>

            {/* 支付方式 */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">支付方式:</span>
              <div className="flex space-x-2">
                <div className="w-8 h-5 bg-gray-700 rounded flex items-center justify-center">
                  <span className="text-xs text-white">💳</span>
                </div>
                <div className="w-8 h-5 bg-gray-700 rounded flex items-center justify-center">
                  <span className="text-xs text-white">🏦</span>
                </div>
                <div className="w-8 h-5 bg-gray-700 rounded flex items-center justify-center">
                  <span className="text-xs text-white">📱</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
