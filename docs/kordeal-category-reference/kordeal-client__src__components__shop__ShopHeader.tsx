import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { categoryAPI, productAPI, type Category } from '../../lib/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function ShopHeader() {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const toggleDarkMode = toggleTheme;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);
  const [hoveredMidCategory, setHoveredMidCategory] = useState<Category | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    categoryAPI.getTree().then(setCategories).catch(() => {});
  }, []);

  // 검색 자동완성
  useEffect(() => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (searchQuery.trim().length < 1) { setSuggestions([]); return; }
    suggestTimer.current = setTimeout(async () => {
      try {
        const data = await productAPI.getSuggestions(searchQuery);
        setSuggestions(data);
      } catch { setSuggestions([]); }
    }, 200);
  }, [searchQuery]);

  // 외부 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) setIsCategoryOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = useCallback((q: string) => {
    const query = q.trim();
    if (!query) return;
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(query)}`);
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch(searchQuery);
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      {/* 상단 유틸리티 바 */}
      <div className="bg-gray-800 dark:bg-gray-950 text-white text-xs py-1">
        <div className="max-w-7xl mx-auto px-4 flex justify-end gap-4">
          <Link to="/my" className="hover:text-gray-300">마이페이지</Link>
          {user ? (
            <>
              <span className="text-gray-400">{user.email}</span>
              <button onClick={signOut} className="hover:text-gray-300">로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/signin" className="hover:text-gray-300">로그인</Link>
              <Link to="/signup" className="hover:text-gray-300">회원가입</Link>
            </>
          )}
          <Link to="/admin" className="hover:text-gray-300">관리자</Link>
        </div>
      </div>

      {/* 메인 헤더 */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* 카테고리 버튼 */}
        <div ref={categoryRef} className="relative">
          <button
            onClick={() => setIsCategoryOpen(v => !v)}
            className="flex flex-col items-center justify-center w-16 h-14 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-xs font-medium">카테고리</span>
          </button>

          {/* 카테고리 드롭다운 */}
          {isCategoryOpen && (
            <div className="absolute top-full left-0 mt-1 flex shadow-2xl border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden z-50 bg-white dark:bg-gray-800"
              style={{ minWidth: 720 }}>
              {/* 대분류 */}
              <div className="w-48 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 overflow-y-auto" style={{ maxHeight: 480 }}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-colors ${hoveredCategory?.id === cat.id ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                    onMouseEnter={() => { setHoveredCategory(cat); setHoveredMidCategory(null); }}
                    onClick={() => { navigate(`/category/${cat.id}`); setIsCategoryOpen(false); }}
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    <span className="flex-1">{cat.name}</span>
                    {cat.children && cat.children.length > 0 && (
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {/* 중분류 */}
              {hoveredCategory && hoveredCategory.children && hoveredCategory.children.length > 0 && (
                <div className="w-44 bg-gray-50 dark:bg-gray-750 border-r border-gray-100 dark:border-gray-700 overflow-y-auto" style={{ maxHeight: 480 }}>
                  {hoveredCategory.children.map(mid => (
                    <button
                      key={mid.id}
                      className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left hover:bg-white dark:hover:bg-gray-700 hover:text-brand-600 transition-colors ${hoveredMidCategory?.id === mid.id ? 'bg-white dark:bg-gray-700 text-brand-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}
                      onMouseEnter={() => setHoveredMidCategory(mid)}
                      onClick={() => { navigate(`/category/${mid.id}`); setIsCategoryOpen(false); }}
                    >
                      <span>{mid.name}</span>
                      {mid.children && mid.children.length > 0 && (
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* 소분류 */}
              {hoveredMidCategory && hoveredMidCategory.children && hoveredMidCategory.children.length > 0 && (
                <div className="w-44 bg-white dark:bg-gray-800 overflow-y-auto" style={{ maxHeight: 480 }}>
                  {hoveredMidCategory.children.map(sub => (
                    <button
                      key={sub.id}
                      className="w-full px-4 py-2.5 text-sm text-left text-gray-600 dark:text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600 transition-colors"
                      onClick={() => { navigate(`/category/${sub.id}`); setIsCategoryOpen(false); }}
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 로고 */}
        <Link to="/" className="flex-shrink-0">
          <div className="text-2xl font-bold text-brand-600 tracking-tight">KORDEAL</div>
        </Link>

        {/* 검색창 */}
        <div ref={searchRef} className="flex-1 relative max-w-2xl">
          <div className="flex border-2 border-brand-500 rounded-lg overflow-hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              placeholder="찾고 싶은 상품을 검색해보세요!"
              className="flex-1 px-4 py-2.5 text-sm outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
            />
            <button
              onClick={() => handleSearch(searchQuery)}
              className="px-5 bg-brand-500 hover:bg-brand-600 text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* 자동완성 드롭다운 */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  className="w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                  onClick={() => { setSearchQuery(s); handleSearch(s); }}
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span dangerouslySetInnerHTML={{
                    __html: s.replace(new RegExp(`(${searchQuery})`, 'gi'), '<strong class="text-brand-600">$1</strong>')
                  }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 우측 아이콘 영역 */}
        <div className="flex items-center gap-3">
          {/* 다크모드 토글 */}
          <button
            onClick={toggleDarkMode}
            className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            title={isDarkMode ? '라이트 모드' : '다크 모드'}
          >
            {isDarkMode ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
            <span className="text-xs mt-0.5">{isDarkMode ? '라이트' : '다크'}</span>
          </button>

          {/* 사용자 메뉴 */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setIsUserMenuOpen(v => !v)}
              className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs mt-0.5">마이코딜</span>
            </button>
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                {user ? (
                  <>
                    <Link to="/my" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">마이페이지</Link>
                    <Link to="/my/orders" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">주문 목록</Link>
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <button onClick={signOut} className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-red-500">로그아웃</button>
                  </>
                ) : (
                  <>
                    <Link to="/signin" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">로그인</Link>
                    <Link to="/signup" className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">회원가입</Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 장바구니 */}
          <Link to="/cart" className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors relative">
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <span className="text-xs mt-0.5">장바구니</span>
          </Link>
        </div>
      </div>

      {/* 빠른 탐색 탭 */}
      <div className="border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
            {[
              { label: '코딜배송', path: '/rocket', color: 'text-blue-600 dark:text-blue-400' },
              { label: '신선식품', path: '/fresh', color: 'text-green-600 dark:text-green-400' },
              { label: '오늘의딜', path: '/deals', color: 'text-red-600 dark:text-red-400' },
              { label: '인기상품', path: '/popular', color: 'text-brand-600 dark:text-brand-400' },
              { label: '신상품', path: '/new', color: 'text-purple-600 dark:text-purple-400' },
            ].map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-shrink-0 px-3 py-2 text-sm font-medium ${item.color} hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
