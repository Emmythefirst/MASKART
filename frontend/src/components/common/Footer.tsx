import { Github, Twitter, MessageCircle } from 'lucide-react';

function Footer() {
  return (
    <footer className="border-t border-primary/10 mt-20">
      <div className="container-custom py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2">
            <h3 className="text-xl font-bold gradient-text mb-3">MasKart</h3>
            <p className="text-gray-400 text-sm mb-4">
              Anonymous e-commerce on Solana. Privacy-first marketplace for digital goods.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-10 h-10 bg-dark-light rounded-lg flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-dark-light rounded-lg flex items-center justify-center hover:bg-primary/20 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-dark-light rounded-lg flex items-center justify-center hover:bg-primary/20 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © 2026 MasKart. Built for Solana Privacy Hackathon.
          </p>
          <p className="text-sm text-gray-500">
            Made with 💜 for privacy advocates
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;