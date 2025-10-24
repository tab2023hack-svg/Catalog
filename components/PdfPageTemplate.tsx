import React from 'react';
import { Product, PdfTheme } from '../types';

interface PdfPageTemplateProps {
  product: Product;
  theme: PdfTheme;
  pageNumber: number;
  totalPages: number;
}

const ThemeWrapper: React.FC<{ theme: PdfTheme; children: React.ReactNode }> = ({ theme, children }) => {
    const themeClasses = {
        [PdfTheme.SIMPLE]: 'bg-white text-gray-800 border-gray-200',
        [PdfTheme.MODERATE]: 'bg-gray-50 text-gray-900 border-gray-300',
        [PdfTheme.FANCY]: 'bg-gray-800 text-white border-gray-700',
    };
    return <div className={`w-[210mm] h-[297mm] p-8 flex flex-col font-sans ${themeClasses[theme]}`}>{children}</div>;
};

const PriceTag: React.FC<{ price: number; theme: PdfTheme }> = ({ price, theme }) => {
    const themeClasses = {
        [PdfTheme.SIMPLE]: 'bg-blue-500 text-white',
        [PdfTheme.MODERATE]: 'bg-teal-600 text-white',
        [PdfTheme.FANCY]: 'bg-yellow-400 text-gray-900',
    };
    return (
        <div className={`p-3 rounded-lg shadow-md ${themeClasses[theme]} w-full`}>
            <p className="text-md text-right opacity-90">السعر</p>
            <p className="text-2xl font-bold text-right">{price.toFixed(2)} جنيه</p>
        </div>
    );
};


export const PdfPageTemplate: React.FC<PdfPageTemplateProps> = ({ product, theme, pageNumber, totalPages }) => {
  const imageCount = product.images.length;
  // Logic to make the grid more compact for more images
  let gridColsClass = 'grid-cols-4'; // Default for 8+ images
  if (imageCount === 1) {
    gridColsClass = 'grid-cols-1';
  } else if (imageCount === 2) {
    gridColsClass = 'grid-cols-2';
  } else if (imageCount === 3 || imageCount === 6 || imageCount === 5) { // 3, 5, or 6 images look good in 3 columns
    gridColsClass = 'grid-cols-3';
  } else if (imageCount === 4) { // 4 images as a 2x2 grid
    gridColsClass = 'grid-cols-2';
  }


  return (
    <div className="page-break-before">
        <ThemeWrapper theme={theme}>
            {/* Custom styles for aspect ratio to ensure it works with html2pdf */}
            <style>{`
                .aspect-square-container { position: relative; width: 100%; padding-bottom: 100%; }
                .aspect-square-container > img { position: absolute; height: 100%; width: 100%; top: 0; right: 0; bottom: 0; left: 0; object-fit: cover; }
            `}</style>
            
            <main className="flex-grow flex flex-col gap-4">
                {/* Images Section at the top */}
                {product.images.length > 0 && (
                    <div className={`grid ${gridColsClass} gap-2`}>
                        {product.images.map(image => (
                            <div key={image.id} className="aspect-square-container rounded-lg overflow-hidden border">
                                <img src={image.src} alt={image.alt} />
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Details Section below images */}
                <div className="mt-4 flex-grow">
                    <div className="grid grid-cols-12 gap-x-6 gap-y-4 h-full">
                        {/* Left part: Name, Colors, Sizes, Notes */}
                        <div className="col-span-8 flex flex-col gap-4">
                             <div>
                                <h1 className={`text-3xl font-bold mb-1 ${theme === PdfTheme.FANCY ? 'text-yellow-300' : 'text-gray-900'}`}>{product.name}</h1>
                                <p className={`text-md ${theme === PdfTheme.FANCY ? 'text-gray-300' : 'text-gray-600'}`}>كود المنتج: {product.code}</p>
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h2 className="text-lg font-bold mb-2">الألوان المتاحة</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {product.colors.map(color => (
                                            <div key={color.id} className="flex items-center gap-2">
                                                <span className="block w-5 h-5 rounded-full border" style={{ backgroundColor: color.hex, borderColor: theme === PdfTheme.FANCY ? '#fff' : '#000' }}></span>
                                                <span className="text-sm">{color.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold mb-2">المقاسات المتاحة</h2>
                                    <div className="flex flex-wrap gap-2">
                                        {product.sizes.map(size => (
                                            <span key={size} className={`px-2 py-1 rounded-full text-xs font-semibold ${theme === PdfTheme.FANCY ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-800'}`}>{size}</span>
                                        ))}
                                    </div>
                                </div>
                             </div>
                             {product.notes && (
                                <div className="pt-2 flex-grow">
                                    <h2 className="text-lg font-bold mb-2">ملاحظات</h2>
                                    <p className="text-sm leading-relaxed bg-gray-100 p-2 rounded-md">{product.notes}</p>
                                </div>
                             )}
                        </div>
                        {/* Right part: Quantity, Price */}
                        <div className="col-span-4 flex flex-col gap-4">
                            <div className="text-right">
                                <h2 className="text-lg font-bold mb-1">الكمية</h2>
                                <p className="text-2xl font-bold">{product.quantity} قطعة</p>
                            </div>
                            <div className="mt-auto">
                                <PriceTag price={product.price} theme={theme} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className={`border-t pt-4 mt-auto text-sm flex justify-between items-center ${theme === PdfTheme.FANCY ? 'border-gray-600' : 'border-gray-200'}`}>
                <p>تاريخ التصدير: {new Date().toLocaleDateString('ar-EG')}</p>
                <p>صفحة {pageNumber} من {totalPages}</p>
            </footer>
        </ThemeWrapper>
    </div>
  );
};
