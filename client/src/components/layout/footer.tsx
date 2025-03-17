import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-lg font-bold text-primary">ForumClone</h2>
            <p className="mt-2 text-sm text-gray-500">A place to discuss and share knowledge</p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">Platform</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/about" className="text-sm text-gray-500 hover:text-primary">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-sm text-gray-500 hover:text-primary">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-sm text-gray-500 hover:text-primary">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="text-sm text-gray-500 hover:text-primary">
                    Status
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">Support</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/help" className="text-sm text-gray-500 hover:text-primary">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/guidelines" className="text-sm text-gray-500 hover:text-primary">
                    Community Guidelines
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-gray-500 hover:text-primary">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-gray-500 hover:text-primary">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">Connect</h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <span className="text-sm text-gray-500 hover:text-primary cursor-pointer">Twitter</span>
                </li>
                <li>
                  <span className="text-sm text-gray-500 hover:text-primary cursor-pointer">Facebook</span>
                </li>
                <li>
                  <span className="text-sm text-gray-500 hover:text-primary cursor-pointer">LinkedIn</span>
                </li>
                <li>
                  <span className="text-sm text-gray-500 hover:text-primary cursor-pointer">GitHub</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-6 md:flex md:items-center md:justify-between">
          <div className="flex space-x-6 md:order-2">
            <button className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Twitter</span>
              <i className="fab fa-twitter text-lg"></i>
            </button>
            <button className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Facebook</span>
              <i className="fab fa-facebook text-lg"></i>
            </button>
            <button className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">LinkedIn</span>
              <i className="fab fa-linkedin text-lg"></i>
            </button>
            <button className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">GitHub</span>
              <i className="fab fa-github text-lg"></i>
            </button>
          </div>
          <p className="mt-8 text-sm text-gray-500 md:mt-0 md:order-1">
            &copy; {new Date().getFullYear()} ForumClone. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
