import React, { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Product, Color, ProjectData, PdfTheme, ProductImage } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ProductList } from './components/ProductList';
import { ProductForm } from './components/ProductForm';
import { PlusIcon } from './components/icons';
import { PDF_THEMES } from './constants';
import { PdfPageTemplate } from './components/PdfPageTemplate';
import { deleteImage, getImage, saveImage, blobToBase64 } from './db';

declare const html2pdf: any;

const App: React.FC = () => {
    const [projectData, setProjectData] = useLocalStorage<ProjectData>('productCatalogData', {
        projectName: 'كتالوج المنتجات',
        createdAt: new Date().toISOString(),
        products: [],
        colors: [
            { id: '1', name: 'أسود', hex: '#000000' },
            { id: '2', name: 'أبيض', hex: '#FFFFFF' },
            { id: '3', name: 'أحمر', hex: '#FF0000' },
        ],
    });

    const [isFormVisible, setIsFormVisible] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [selectedPdfTheme, setSelectedPdfTheme] = useState<PdfTheme>(PdfTheme.SIMPLE);

    const handleAddProductClick = () => {
        setProductToEdit(null);
        setIsFormVisible(true);
    };

    const handleEditProduct = (product: Product) => {
        setProductToEdit(product);
        setIsFormVisible(true);
    };

    const handleCancelForm = () => {
        setIsFormVisible(false);
        setProductToEdit(null);
    };

    const handleSaveProduct = (product: Product) => {
        setProjectData(prevData => {
            const productExists = prevData.products.some(p => p.id === product.id);
            if (productExists) {
                return {
                    ...prevData,
                    products: prevData.products.map(p => (p.id === product.id ? product : p)),
                };
            }
            return {
                ...prevData,
                products: [...prevData.products, product],
            };
        });
        setIsFormVisible(false);
        setProductToEdit(null);
    };

    const handleDeleteProduct = async (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
            const productToDelete = projectData.products.find(p => p.id === id);
            if (productToDelete) {
                await Promise.all(productToDelete.images.map(img => deleteImage(img.id)));
            }
            setProjectData(prevData => ({
                ...prevData,
                products: prevData.products.filter(p => p.id !== id),
            }));
        }
    };

    const handleDuplicateProduct = async (product: Product) => {
      if (window.confirm(`هل أنت متأكد من تكرار المنتج "${product.name}"؟`)) {
        const newImages = await Promise.all(
          product.images.map(async (img) => {
            const blob = await getImage(img.id);
            if (!blob) return null;
            // FIX: The type predicate `img is ProductImage` requires `ProductImage` to be assignable to the type of `img`.
            // By explicitly typing `newImageId` as `string`, we prevent TypeScript from inferring a more specific template literal type from `crypto.randomUUID()`,
            // which would make the element type of `newImages` incompatible with `ProductImage`.
            const newImageId: string = crypto.randomUUID();
            await saveImage(newImageId, blob);
            return { ...img, id: newImageId };
          })
        );

        const newProduct: Product = {
          ...product,
          id: crypto.randomUUID(),
          code: `${product.code}-نسخة`,
          images: newImages.filter((img): img is ProductImage => img !== null),
        };

        setProjectData(prevData => ({
          ...prevData,
          products: [...prevData.products, newProduct],
        }));
      }
    };

    const handleAddColor = (color: Omit<Color, 'id'>) => {
        const newColor = { ...color, id: crypto.randomUUID() };
        setProjectData(prevData => ({
            ...prevData,
            colors: [...prevData.colors, newColor],
        }));
    };

    const handleUpdateColor = (updatedColor: Color) => {
        setProjectData(prevData => {
            const newColors = prevData.colors.map(color =>
                color.id === updatedColor.id ? updatedColor : color
            );
            const newProducts = prevData.products.map(product => {
                const needsUpdate = product.colors.some(c => c.id === updatedColor.id);
                if (!needsUpdate) return product;
                return {
                    ...product,
                    colors: product.colors.map(c => c.id === updatedColor.id ? updatedColor : c)
                };
            });
            return {
                ...prevData,
                colors: newColors,
                products: newProducts,
            };
        });
    };

    const generatePdf = async () => {
        if (projectData.products.length === 0) {
            alert("لا يوجد منتجات للتصدير");
            return;
        }
        setIsGeneratingPdf(true);
        try {
            const productsWithImageSrc = await Promise.all(
                projectData.products.map(async (product) => {
                    const hydratedImages = await Promise.all(
                        product.images.map(async (img) => {
                            const blob = await getImage(img.id);
                            if (blob) {
                                const base64 = await blobToBase64(blob);
                                return { ...img, src: base64 };
                            }
                            return { ...img, src: '' };
                        })
                    );
                    return { ...product, images: hydratedImages };
                })
            );

            const pdfContainer = document.createElement('div');
            document.body.appendChild(pdfContainer);

            const pagesMarkup = productsWithImageSrc.map((product, index) =>
                renderToStaticMarkup(
                    <PdfPageTemplate
                        product={product}
                        theme={selectedPdfTheme}
                        pageNumber={index + 1}
                        totalPages={productsWithImageSrc.length}
                    />
                )
            ).join('');

            pdfContainer.innerHTML = pagesMarkup;

            const opt = {
              margin: 0,
              filename: `${projectData.projectName}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, allowTaint: true },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            await html2pdf().from(pdfContainer).set(opt).save();
            
            document.body.removeChild(pdfContainer);

        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("حدث خطأ أثناء إنشاء الملف.");
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    return (
        <div dir="rtl" className="bg-gray-100 min-h-screen font-sans">
            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800">{projectData.projectName}</h1>
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={handleAddProductClick}
                            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm md:text-base"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">إضافة منتج</span>
                        </button>

                        <div className="flex items-center gap-2">
                             <select
                                value={selectedPdfTheme}
                                onChange={(e) => setSelectedPdfTheme(e.target.value as PdfTheme)}
                                className="border-gray-300 rounded-md shadow-sm text-sm"
                            >
                                {PDF_THEMES.map(theme => (
                                    <option key={theme.id} value={theme.id}>{theme.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={generatePdf}
                                disabled={isGeneratingPdf || projectData.products.length === 0}
                                className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm md:text-base"
                            >
                                {isGeneratingPdf ? 'جاري الإنشاء...' : 'تصدير PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ProductList
                    products={projectData.products}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                    onDuplicate={handleDuplicateProduct}
                    onAdd={handleAddProductClick}
                />
            </main>

            {isFormVisible && (
                <ProductForm
                    productToEdit={productToEdit}
                    onSave={handleSaveProduct}
                    onCancel={handleCancelForm}
                    availableColors={projectData.colors}
                    onColorAdd={handleAddColor}
                    onColorUpdate={handleUpdateColor}
                />
            )}
        </div>
    );
};

export default App;