import Link from 'next/link'
import { NexFanLogo } from '@/components/brand/logo'
import { Twitter, Instagram, Youtube, Github } from 'lucide-react'

const footerLinks = {
  product: [
    { name: 'Explorar', href: '/explore' },
    { name: 'Criadores', href: '/creators' },
    { name: 'Preços', href: '/pricing' },
    { name: 'FAQ', href: '/faq' },
  ],
  company: [
    { name: 'Sobre', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Carreiras', href: '/careers' },
    { name: 'Contato', href: '/contact' },
  ],
  legal: [
    { name: 'Termos de Uso', href: '/terms' },
    { name: 'Privacidade', href: '/privacy' },
    { name: 'Política de Conteúdo', href: '/content-policy' },
    { name: 'Cookies', href: '/cookies' },
    { name: 'DMCA', href: '/dmca' },
  ],
  creators: [
    { name: 'Começar', href: '/become-creator' },
    { name: 'Recursos', href: '/creator-resources' },
    { name: 'Comunidade', href: '/community' },
    { name: 'Suporte', href: '/support' },
  ],
}

const socialLinks = [
  { name: 'Twitter', href: 'https://twitter.com/nexfan', icon: Twitter },
  { name: 'Instagram', href: 'https://instagram.com/nexfan', icon: Instagram },
  { name: 'YouTube', href: 'https://youtube.com/nexfan', icon: Youtube },
  { name: 'GitHub', href: 'https://github.com/nexfan', icon: Github },
]

export function Footer() {
  return (
    <footer className="bg-deep-navy text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <NexFanLogo variant="light" className="h-8 mb-4" />
            <p className="text-body-sm text-white/60 mb-6 max-w-xs">
              A próxima geração de conexão e monetização entre criadores e fãs.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-nex bg-white/5 hover:bg-white/10 transition-colors"
                  aria-label={link.name}
                >
                  <link.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-headline font-semibold text-body-sm mb-4">Produto</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-headline font-semibold text-body-sm mb-4">Empresa</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-headline font-semibold text-body-sm mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-headline font-semibold text-body-sm mb-4">Criadores</h4>
            <ul className="space-y-3">
              {footerLinks.creators.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-caption text-white/40">
            © {new Date().getFullYear()} NexFan. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-caption text-white/40">🇧🇷 Português (Brasil)</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

