import React, { useState, useEffect } from 'react';
import { Product, ProductImage } from '../types';
import { EditIcon, TrashIcon, DuplicateIcon } from './icons';
import { getImage } from '../db';

const ImageDisplay: React.FC<{ imageId: string; altText: string }> = ({ imageId, altText }) => {
    const [src, setSrc] = useState<string | undefined>(undefined);

    useEffect(() => {
        let objectUrl: string | undefined;

        const load = async () => {
            const blob = await getImage(imageId);
            if (blob) {
                objectUrl = URL.createObjectURL(blob);
                setSrc(objectUrl);
            } else {
                // Handle case where image is not found in DB
                setSrc(undefined);
            }
        };
        load();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [imageId]);

    if (src === undefined) {
        return <div className="w-full h-48 bg-gray-200 animate-pulse"></div>;
    }

    return <img src={src} alt={altText} className="w-full h-48 object-cover" />;
};


interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onDuplicate: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete, onDuplicate }) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!product.images || product.images.length === 0) {
      return 0;
    }
    const coverIndex = product.images.findIndex(img => img.isCover);
    return coverIndex > -1 ? coverIndex : 0;
  });

  const hasMultipleImages = product.images.length > 1;

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prevIndex => (prevIndex === 0 ? product.images.length - 1 : prevIndex - 1));
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prevIndex => (prevIndex === product.images.length - 1 ? 0 : prevIndex + 1));
  };
  
  const currentImage = product.images[currentIndex];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition-shadow hover:shadow-xl">
      <div className="relative group">
        {currentImage ? (
          <ImageDisplay imageId={currentImage.id} altText={currentImage.alt} />
        ) : (
          <div className="w-full h-48 bg-gray-300 flex items-center justify-center">
            <span className="text-gray-500">No Image</span>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 text-sm rounded z-10">{product.code}</div>
        
        {hasMultipleImages && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-opacity-60"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-opacity-60"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'}`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
        <p className="text-xl font-semibold text-blue-600 mt-1">{product.price.toFixed(2)}</p>
        <div className="mt-2 text-sm text-gray-600 flex-grow">
          <p>الكمية: {product.quantity}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {product.sizes.map(s => <span key={s} className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">{s}</span>)}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {product.colors.map(c => <span key={c.id} className="w-5 h-5 rounded-full border" style={{ backgroundColor: c.hex }} title={c.name}></span>)}
          </div>
          {product.sizeChart && product.sizeChart.length > 0 && (
            <div className="mt-3">
                <table className="w-full text-center text-xs border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="border border-gray-300 p-1 font-semibold text-gray-700">المقاس</th>
                            <th className="border border-gray-300 p-1 font-semibold text-gray-700">العرض</th>
                        </tr>
                    </thead>
                    <tbody>
                        {product.sizeChart.map((row) => (
                            <tr key={row.id}>
                                <td className="border border-gray-300 p-1 text-gray-800">{row.size}</td>
                                <td className="border border-gray-300 p-1 text-gray-800">{row.width}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={() => onDuplicate(product)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full" title="تكرار"><DuplicateIcon className="w-5 h-5" /></button>
          <button onClick={() => onEdit(product)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full" title="تعديل"><EditIcon className="w-5 h-5" /></button>
          <button onClick={() => onDelete(product.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full" title="حذف"><TrashIcon className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
};


interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onDuplicate: (product: Product) => void;
  onAdd: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({ products, onEdit, onDelete, onDuplicate, onAdd }) => {
  return (
    <div className="p-4 md:p-8">
        {products.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg">
                <h2 className="text-xl font-semibold text-gray-700">لم تتم إضافة أي منتجات بعد</h2>
                <p className="text-gray-500 mt-2">انقر على زر "إضافة منتج جديد" للبدء.</p>
                <button
                    onClick={onAdd}
                    className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors shadow-sm font-semibold"
                >
                    إضافة منتج جديد
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {products.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onDuplicate={onDuplicate}
                    />
                ))}
            </div>
        )}
    </div>
  );
};
