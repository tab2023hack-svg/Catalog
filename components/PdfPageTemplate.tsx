
import React from 'react';
import { Product, PdfTheme, ProductImage } from '../types';

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

const formatPrice = (price: number) => {
    // This will show 44.50 as 44.5 and 44.00 as 44.
    return parseFloat(price.toFixed(2)); 
}

const PriceTag: React.FC<{ price: number; theme: PdfTheme }> = ({ price, theme }) => {
    const themeClasses = {
        [PdfTheme.SIMPLE]: 'bg-blue-500 text-white',
        [PdfTheme.MODERATE]: 'bg-teal-600 text-white',
        [PdfTheme.FANCY]: 'bg-yellow-400 text-gray-900',
    };
    return (
        <div className={`p-3 rounded-lg shadow-md ${themeClasses[theme]} w-full`}>
            <p className="text-md text-right opacity-90">السعر</p>
            <p className="text-2xl font-bold text-right">{formatPrice(price)} جنيه</p>
        </div>
    );
};


export const PdfPageTemplate: React.FC<PdfPageTemplateProps> = ({ product, theme }) => {
  const imagesToShow = product.images;

  const ImageCell: React.FC<{ image: ProductImage }> = ({ image }) => (
    <div className="bg-gray-100 rounded-lg overflow-hidden border">
      <img 
        src={image.src} 
        alt={image.alt} 
        className="w-full h-auto block"
      />
    </div>
  );

  const renderImages = () => {
    if (imagesToShow.length === 0) return null;

    return (
      <div className="grid grid-cols-3 gap-2 items-start">
        {imagesToShow.map(img => <ImageCell key={img.id} image={img} />)}
      </div>
    );
  };
  
  const tableBorderStyle = `1px solid ${theme === PdfTheme.FANCY ? '#555' : '#999'}`;


  return (
    <div className="page-break-before">
        <ThemeWrapper theme={theme}>
            <main className="flex-grow flex flex-col gap-4">
                {/* Images Section with 3-column layout */}
                {renderImages()}
                
                {/* Details Section below images */}
                <div className="mt-4 flex-grow flex flex-col">
                    <div className="grid grid-cols-12 gap-x-6 gap-y-4">
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
                             {product.sizeChart && product.sizeChart.length > 0 && (
                                <div className="pt-2">
                                    <table 
                                        style={{
                                            width: '100%',
                                            borderCollapse: 'collapse',
                                            border: tableBorderStyle,
                                            fontSize: '14px',
                                            textAlign: 'center',
                                            color: theme === PdfTheme.FANCY ? 'white' : 'black',
                                        }}
                                    >
                                        <thead>
                                            <tr style={{ backgroundColor: '#d90429', color: 'white', fontWeight: 'bold' }}>
                                                <th colSpan={(product.sizeChart.length || 0) + 1} style={{ border: tableBorderStyle, padding: '8px' }}>
                                                    SIZE CHART
                                                </th>
                                            </tr>
                                            <tr className={theme === PdfTheme.FANCY ? 'bg-gray-700' : 'bg-gray-100'}>
                                                <th style={{ border: tableBorderStyle, padding: '6px', fontWeight: 'bold' }}>SIZE</th>
                                                {product.sizeChart.map((row) => (
                                                    <th key={row.id} style={{ border: tableBorderStyle, padding: '6px' }}>{row.size}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td style={{ border: tableBorderStyle, padding: '6px', fontWeight: 'bold' }}>WIDTH</td>
                                                {product.sizeChart.map((row) => (
                                                    <td key={row.id} style={{ border: tableBorderStyle, padding: '6px' }}>{row.width}</td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                             )}
                             {product.notes && (
                                <div className="pt-2">
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
                            <PriceTag price={product.price} theme={theme} />
                        </div>
                    </div>
                     {product.notes && (
                        <div className="pt-4 mt-auto">
                            <h2 className="text-lg font-bold mb-2">ملاحظات</h2>
                            <p className="text-sm leading-relaxed bg-gray-100 p-3 rounded-md border">{product.notes}</p>
                        </div>
                     )}
                </div>
            </main>
        </ThemeWrapper>
    </div>
  );
};
