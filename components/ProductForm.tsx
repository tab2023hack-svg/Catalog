
import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Product, ProductImage, Size, Color } from '../types';
import { AVAILABLE_SIZES } from '../constants';
import { PlusIcon, TrashIcon, UploadIcon, CheckCircleIcon } from './icons';
import { saveImage, deleteImage, getImage } from '../db';


interface ProductFormProps {
  productToEdit: Product | null;
  onSave: (product: Product) => void;
  onCancel: () => void;
  availableColors: Color[];
  onColorAdd: (color: Omit<Color, 'id'>) => void;
}

const ImageUploader: React.FC<{
    images: ProductImage[];
    onImagesChange: React.Dispatch<React.SetStateAction<ProductImage[]>>;
}> = ({ images, onImagesChange }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (files: FileList | null) => {
        if (!files) return;

        Array.from(files).forEach(async (file) => {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert(`Image ${file.name} is too large. Maximum size is 10MB.`);
                return;
            }
            
            const newImageId = crypto.randomUUID();
            await saveImage(newImageId, file);

            const newImage: ProductImage = {
                id: newImageId,
                src: URL.createObjectURL(file),
                alt: file.name,
                isCover: images.length === 0,
            };
            onImagesChange(prevImages => [...prevImages, newImage]);
        });
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileChange(e.dataTransfer.files);
    };
    
    const removeImage = async (id: string) => {
        await deleteImage(id);
        const imageToRemove = images.find(img => img.id === id);
        if (imageToRemove?.src) {
            URL.revokeObjectURL(imageToRemove.src);
        }

        onImagesChange(prevImages => {
            const remainingImages = prevImages.filter(img => img.id !== id);
            if (remainingImages.length > 0 && prevImages.find(img => img.id === id)?.isCover) {
                remainingImages[0].isCover = true;
            }
            return remainingImages;
        });
    };
    
    const setAsCover = (id: string) => {
        onImagesChange(prevImages => prevImages.map(img => ({ ...img, isCover: img.id === id })));
    };

    const updateAltText = (id: string, alt: string) => {
        onImagesChange(prevImages => prevImages.map(img => (img.id === id ? { ...img, alt } : img)));
    };

    return (
        <div>
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
                }`}
            >
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">اسحب وأفلت الصور هنا، أو</p>
                <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-800 font-semibold">
                    اختر ملفات
                </label>
                <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    multiple
                    accept="image/png, image/jpeg"
                    onChange={(e) => handleFileChange(e.target.files)}
                />
                <p className="text-xs text-gray-500 mt-1">PNG, JPG حتى 10 ميجابايت</p>
            </div>
            {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((image) => (
                        <div key={image.id} className="relative group border rounded-lg overflow-hidden shadow-sm">
                            <img src={image.src} alt={image.alt} className="w-full h-32 object-cover" />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex flex-col justify-between p-2">
                                <div className="flex justify-between">
                                    {image.isCover ? (
                                        <CheckCircleIcon className="w-6 h-6 text-green-400" />
                                    ) : (
                                        <button type="button" onClick={() => setAsCover(image.id)} className="opacity-0 group-hover:opacity-100 bg-white/80 p-1 rounded-full text-gray-700 hover:bg-white" title="تعيين كصورة رئيسية">
                                            <CheckCircleIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button type="button" onClick={() => removeImage(image.id)} className="opacity-0 group-hover:opacity-100 bg-red-500/80 p-1 rounded-full text-white hover:bg-red-600" title="حذف الصورة">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <input 
                                    type="text"
                                    value={image.alt}
                                    onChange={(e) => updateAltText(image.id, e.target.value)}
                                    placeholder="وصف الصورة"
                                    className="opacity-0 group-hover:opacity-100 w-full bg-black/50 text-white text-xs p-1 rounded border-none"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const ProductForm: React.FC<ProductFormProps> = ({ productToEdit, onSave, onCancel, availableColors, onColorAdd }) => {
  const [product, setProduct] = useState<Product>({
    id: '', code: '', name: '', price: 0, quantity: 1, sizes: [], colors: [], images: [], notes: ''
  });
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');

  useEffect(() => {
    const initialState: Product = {
        id: crypto.randomUUID(), code: '', name: '', price: 0, quantity: 1, sizes: [], colors: [], images: [], notes: ''
    };

    if (productToEdit) {
      const hydrateImages = async () => {
        const hydratedImages = await Promise.all(
          productToEdit.images.map(async (img) => {
            const blob = await getImage(img.id);
            return {
              ...img,
              src: blob ? URL.createObjectURL(blob) : undefined,
            };
          })
        );
        setProduct({ ...productToEdit, images: hydratedImages });
      };
      hydrateImages();
    } else {
        setProduct(initialState);
    }

    return () => {
        // Cleanup object URLs on unmount or when productToEdit changes
        product.images.forEach(image => {
            if (image.src?.startsWith('blob:')) {
                URL.revokeObjectURL(image.src);
            }
        });
    }
  }, [productToEdit]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setProduct(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSizeChange = (size: Size) => {
    setProduct(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size) ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size]
    }));
  };

  const handleSelectAllSizes = () => {
    if (product.sizes.length === AVAILABLE_SIZES.length) {
      setProduct(prev => ({ ...prev, sizes: [] }));
    } else {
      setProduct(prev => ({ ...prev, sizes: AVAILABLE_SIZES }));
    }
  };

  const handleColorToggle = (color: Color) => {
     setProduct(prev => ({
      ...prev,
      colors: prev.colors.some(c => c.id === color.id) 
        ? prev.colors.filter(c => c.id !== color.id) 
        : [...prev.colors, color]
    }));
  };

  const handleAddNewColor = () => {
    if (newColorName.trim()) {
        onColorAdd({ name: newColorName, hex: newColorHex });
        setNewColorName('');
        setNewColorHex('#000000');
    }
  };
  
  const handleImagesChange = useCallback((imagesUpdater: React.SetStateAction<ProductImage[]>) => {
     setProduct(prev => ({ ...prev, images: typeof imagesUpdater === 'function' ? imagesUpdater(prev.images) : imagesUpdater }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.code) {
        alert("كود المنتج مطلوب.");
        return;
    }
    if (product.images.length === 0) {
        alert("يجب رفع صورة واحدة على الأقل.");
        return;
    }
    onSave({ ...product, id: productToEdit?.id || product.id });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-8 m-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">{productToEdit ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">كود المنتج *</label>
              <input type="text" name="code" id="code" value={product.code} onChange={handleChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="PRD-001" />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">اسم المنتج</label>
              <input type="text" name="name" id="name" value={product.name} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="اسم المنتج" />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">السعر</label>
              <input type="number" name="price" id="price" value={product.price} onChange={handleChange} step="0.01" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="250.00" />
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">الكمية</label>
              <input type="number" name="quantity" id="quantity" value={product.quantity} onChange={handleChange} min="0" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="10" />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700">المقاسات المتاحة</h3>
            <div className="mt-2 flex items-center gap-4 flex-wrap">
              {AVAILABLE_SIZES.map(size => (
                <label key={size} className="flex items-center space-x-2">
                  <input type="checkbox" checked={product.sizes.includes(size)} onChange={() => handleSizeChange(size)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <span>{size}</span>
                </label>
              ))}
              <button type="button" onClick={handleSelectAllSizes} className="text-sm text-blue-600 hover:underline">
                {product.sizes.length === AVAILABLE_SIZES.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700">الألوان المتاحة</h3>
            <div className="p-4 border rounded-md mt-2 space-y-4">
                <div className="flex flex-wrap gap-2">
                    {availableColors.map(color => (
                         <button type="button" key={color.id} onClick={() => handleColorToggle(color)} className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${product.colors.some(c => c.id === color.id) ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-gray-100 hover:bg-gray-200'}`}>
                            <span className="w-5 h-5 rounded-full" style={{ backgroundColor: color.hex }}></span>
                            <span>{color.name}</span>
                        </button>
                    ))}
                </div>
                 <div className="flex items-center gap-2 pt-4 border-t">
                    <input type="text" value={newColorName} onChange={(e) => setNewColorName(e.target.value)} placeholder="اسم اللون الجديد" className="border-gray-300 rounded-md shadow-sm" />
                    <input type="color" value={newColorHex} onChange={(e) => setNewColorHex(e.target.value)} className="w-10 h-10 p-0 border-none rounded-md" />
                    <button type="button" onClick={handleAddNewColor} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300"><PlusIcon className="w-5 h-5" /></button>
                </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700">صور المنتج</h3>
            <ImageUploader images={product.images} onImagesChange={handleImagesChange} />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">ملاحظات إضافية</label>
            <textarea name="notes" id="notes" value={product.notes} onChange={handleChange} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">إلغاء</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              {productToEdit ? 'حفظ التعديلات' : 'إضافة المنتج'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
