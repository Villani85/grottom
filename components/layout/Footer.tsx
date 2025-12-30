import Link from "next/link"
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiMail, FiPhone, FiMapPin } from "react-icons/fi"

const Footer = () => {
  return (
    <footer className="glass-effect border-t border-[#005FD7]/20 mt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-[#005FD7] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-2xl">BH</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-gradient">BRAIN HACKING ACADEMY</h2>
                <p className="text-xs text-gray-400 font-medium">Hackera mente e comportamento umano</p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed">
              La prima accademia online italiana progettata per hackerare mente e comportamento umano attraverso
              neuroscienza, economia comportamentale e psicologia applicata.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Navigazione</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-[#005FD7] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/marketing/come-funziona" className="text-gray-400 hover:text-[#005FD7] transition-colors">
                  Come Funziona
                </Link>
              </li>
              <li>
                <Link href="/marketing/gamification" className="text-gray-400 hover:text-[#005FD7] transition-colors">
                  Gamification
                </Link>
              </li>
              <li>
                <Link href="/marketing/abbonamento" className="text-gray-400 hover:text-[#005FD7] transition-colors">
                  Abbonamento
                </Link>
              </li>
              <li>
                <Link href="/area-riservata/live" className="text-gray-400 hover:text-[#005FD7] transition-colors">
                  Live Events
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legale</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-[#005FD7] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-[#005FD7] transition-colors">
                  Termini di Servizio
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-400 hover:text-[#005FD7] transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-gray-400 hover:text-[#005FD7] transition-colors">
                  Politica di Rimborso
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-6 text-gradient">Contatti</h3>
            <ul className="space-y-4">
              <li className="flex items-center space-x-3 text-gray-400 hover:text-[#005FD7] transition-colors">
                <FiMail className="flex-shrink-0" />
                <span>info@brainhackingacademy.com</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400 hover:text-[#005FD7] transition-colors">
                <FiPhone className="flex-shrink-0" />
                <span>+39 02 1234 5678</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400 hover:text-[#005FD7] transition-colors">
                <FiMapPin className="flex-shrink-0" />
                <span>Milano, Italia</span>
              </li>
            </ul>

            <div className="mt-8">
              <h4 className="text-sm font-bold mb-4 text-gradient">Seguici</h4>
              <div className="flex space-x-4">
                {[FiFacebook, FiTwitter, FiInstagram, FiLinkedin].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-10 h-10 glass-effect rounded-lg flex items-center justify-center text-gray-400 hover:text-[#005FD7] hover:border-[#005FD7] transition-all hover:scale-110"
                  >
                    <Icon size={20} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#005FD7]/20 mt-12 pt-8 text-center text-gray-500">
          <p className="font-medium">© {new Date().getFullYear()} BRAIN HACKING ACADEMY. Tutti i diritti riservati.</p>
          <p className="mt-2 text-sm">P.IVA 12345678901 | REA MI-1234567</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
