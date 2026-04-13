import React, { useState, useEffect, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function BlogForm({ onSubmit, onClose, initialData = null }) {
  const [form, setForm] = useState({
    title: '', summary: '', date: '',
    slug: '',
    seoFocusKeyword: '', seoTitle: '', seoMetaDescription: ''
  });
  const [content, setContent] = useState('');
  const [bannerImage, setBannerImage] = useState(null); // Main hero/banner image
  const [galleryImages, setGalleryImages] = useState([]); // Array of additional images
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  // FAQ handlers
  const addFaq = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const updateFaq = (index, field, value) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    setFaqs(newFaqs);
  };

  const removeFaq = (index) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => {
      const newForm = { ...prev, [name]: value };
      if (name === 'title' && !slugTouched) {
        newForm.slug = titleToSlug(value);
      }
      return newForm;
    });
  }

  const handleSlugChange = (e) => {
    setSlugTouched(true);
    setForm((prev) => ({ ...prev, slug: titleToSlug(e.target.value) }));
  };

  const generateSlugFromTitle = useCallback(() => {
    setForm((prev) => ({ 
      ...prev, 
      slug: titleToSlug(prev.title) 
    }));
    setSlugTouched(false);
  }, []);

  const titleToSlug = (text) => {
    if (!text) return '';
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Handle banner image upload (single file)
  async function handleBannerChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const base64 = await convertToBase64(file);
      setBannerImage(base64);
      setBannerPreview(URL.createObjectURL(file));
    } catch (error) {
      console.error('Banner image conversion error:', error);
    }
    setLoading(false);
  }

  // Handle gallery images upload (multiple files)
  async function handleGalleryChange(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setLoading(true);
    const newImages = [];
    const newPreviews = [];
    
    for (let file of files) {
      try {
        const base64 = await convertToBase64(file);
        newImages.push(base64);
        newPreviews.push(URL.createObjectURL(file));
      } catch (error) {
        console.error('Gallery image conversion error:', error);
      }
    }
    
    setGalleryImages([...galleryImages, ...newImages]);
    setGalleryPreviews([...galleryPreviews, ...newPreviews]);
    setLoading(false);
  }

  // Remove gallery image
  const removeGalleryImage = (index) => {
    const newImages = [...galleryImages];
    const newPreviews = [...galleryPreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setGalleryImages(newImages);
    setGalleryPreviews(newPreviews);
  };

  // Remove banner image
  const removeBannerImage = () => {
    setBannerImage(null);
    if (bannerPreview) {
      URL.revokeObjectURL(bannerPreview);
      setBannerPreview(null);
    }
  };

  function handleSubmit(e) {
    e.preventDefault();
    
    // Structure images properly
    const imagesObj = {
      cover: bannerImage, // Main banner/hero image
      thumbnail: bannerImage, // Use same for thumbnail
      gallery: galleryImages // Additional inline images
    };
    
    const formWithImages = {
      ...form,
      content,
      images: imagesObj,
      faqs,
      date: new Date(form.date)
    };
    
    console.log('SUBMIT BLOG DATA:', formWithImages);
    onSubmit(formWithImages);
  }

  useEffect(() => {
    if (!initialData) return;
    
    setForm({
      title: initialData.title || '',
      summary: initialData.summary || '',
      slug: initialData.slug || titleToSlug(initialData.title),
      date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
      seoFocusKeyword: initialData.seoFocusKeyword || '',
      seoTitle: initialData.seoTitle || '',
      seoMetaDescription: initialData.seoMetaDescription || ''
    });
    setSlugTouched(!!initialData.slug);
    setContent(initialData.content || '');
    
    // Load existing images
    if (initialData.images) {
      if (initialData.images.cover || initialData.images.thumbnail) {
        setBannerImage(initialData.images.cover || initialData.images.thumbnail);
      }
      if (initialData.images.gallery && initialData.images.gallery.length) {
        setGalleryImages(initialData.images.gallery);
      } else if (initialData.images.length > 1) {
        // Handle old format where images was an array
        setBannerImage(initialData.images[0]);
        setGalleryImages(initialData.images.slice(1));
      }
    }
    
    setFaqs(initialData.faqs || []);
  }, [initialData]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      galleryPreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [bannerPreview, galleryPreviews]);

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'], // Added image button for inline images
      [{ align: [] }],
      [{ color: [] }, { background: [] }],
      [{ font: [] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      ['clean']
    ]
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-2xl w-[850px] max-h-[90vh] overflow-y-auto border border-gray-100">
      <h2 className="text-2xl font-bold mb-8 text-neutral-900 border-b border-gray-200 pb-4">
        {initialData ? 'Edit Blog' : 'Add Blog'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Blog Title</label>
          <input 
            name="title" 
            value={form.title} 
            onChange={handleChange} 
            placeholder="Enter blog title" 
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-[#c48e53]/20 focus:border-[#c48e53] transition-all duration-200 text-lg" 
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Blog Slug <span className="text-xs text-gray-500">(URL-friendly)</span>
          </label>
          <div className="flex gap-2">
            <input 
              name="slug" 
              value={form.slug} 
              onChange={handleSlugChange} 
              placeholder="my-blog-post" 
              className="flex-1 p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-[#c48e53]/20 focus:border-[#c48e53] transition-all duration-200 text-lg bg-gray-50" 
              required 
            />
            <button 
              type="button" 
              onClick={generateSlugFromTitle} 
              className="px-4 py-3 bg-[#c48e53]/20 hover:bg-[#c48e53]/30 text-[#c48e53] font-medium rounded-xl border border-[#c48e53]/30 transition-all duration-200 whitespace-nowrap text-sm"
            >
              Generate
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            URL: <code className="bg-gray-100 px-2 py-1 rounded text-[#c48e53] font-mono">/blog/{form.slug || 'your-slug'}</code>
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Summary</label>
          <textarea 
            name="summary" 
            value={form.summary} 
            onChange={handleChange} 
            placeholder="Brief summary (shows on blog cards)" 
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-[#c48e53]/20 focus:border-[#c48e53] resize-vertical h-28 transition-all duration-200" 
            required 
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">Blog Content</label>
          <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <ReactQuill 
              theme="snow" 
              value={content} 
              onChange={setContent} 
              modules={modules} 
              placeholder="Write your full blog content here... You can use [image:0], [image:1] etc. to insert gallery images at specific positions" 
              className="w-full" 
              style={{ height: '350px' }} 
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Tip: Use <code className="bg-gray-100 px-1 rounded">[image:0]</code>, <code className="bg-gray-100 px-1 rounded">[image:1]</code> etc. to insert gallery images at specific positions in your content
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Publish Date</label>
          <input 
            name="date" 
            type="date" 
            value={form.date} 
            onChange={handleChange} 
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-[#c48e53]/20 focus:border-[#c48e53] transition-all duration-200 cursor-pointer" 
            required 
          />
        </div>

        {/* Banner/Hero Image Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Banner / Hero Image <span className="text-xs text-gray-500">(Main featured image - full width)</span>
          </label>
          
          {bannerPreview ? (
            <div className="relative">
              <img 
                src={bannerPreview} 
                alt="Banner preview" 
                className="w-full h-64 object-cover rounded-xl shadow-md"
              />
              <button
                type="button"
                onClick={removeBannerImage}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleBannerChange} 
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#c48e53] file:text-white hover:file:bg-[#a07a3a] hover:border-[#c48e53]/50 cursor-pointer transition-all duration-200" 
            />
          )}
          {bannerImage && !bannerPreview && (
            <p className="text-sm text-green-600 mt-2 font-medium">✅ Banner image loaded</p>
          )}
        </div>

        {/* Gallery Images Section */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Gallery Images <span className="text-xs text-gray-500">(Additional images for inline placement)</span>
          </label>
          
          <input 
            type="file" 
            accept="image/*" 
            multiple 
            onChange={handleGalleryChange} 
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#c48e53] file:text-white hover:file:bg-[#a07a3a] hover:border-[#c48e53]/50 cursor-pointer transition-all duration-200" 
          />
          
          {galleryPreviews.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">{galleryPreviews.length} gallery image(s):</p>
              <div className="grid grid-cols-3 gap-3">
                {galleryPreviews.map((preview, idx) => (
                  <div key={idx} className="relative group">
                    <img 
                      src={preview} 
                      alt={`Gallery ${idx + 1}`} 
                      className="w-full h-32 object-cover rounded-lg shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
                      [image:{idx}]
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {galleryImages.length > 0 && !galleryPreviews.length && (
            <p className="text-sm text-green-600 mt-2 font-medium">✅ {galleryImages.length} gallery image(s) loaded</p>
          )}
        </div>

        {/* SEO Fields */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">SEO Focus Keyword</label>
          <input 
            name="seoFocusKeyword" 
            value={form.seoFocusKeyword} 
            onChange={handleChange} 
            placeholder="Main keyword for SEO" 
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-[#c48e53]/20 focus:border-[#c48e53] transition-all duration-200" 
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">SEO Title</label>
          <input 
            name="seoTitle" 
            value={form.seoTitle} 
            onChange={handleChange} 
            placeholder="SEO optimized title" 
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-[#c48e53]/20 focus:border-[#c48e53] transition-all duration-200" 
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">SEO Meta Description</label>
          <textarea 
            name="seoMetaDescription" 
            value={form.seoMetaDescription} 
            onChange={handleChange} 
            placeholder="Meta description for search engines (150-160 characters)" 
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-4 focus:ring-[#c48e53]/20 focus:border-[#c48e53] resize-vertical h-24 transition-all duration-200" 
          />
        </div>

        {/* FAQ Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Blog FAQs <span className="text-xs text-gray-500">(Optional - specific to this blog)</span>
          </label>
          <div className="space-y-3 max-h-48 overflow-y-auto border p-4 rounded-xl bg-gray-50">
            {faqs.map((faq, index) => (
              <div key={index} className="flex gap-3 p-3 bg-white rounded-lg border">
                <div className="flex-1 space-y-2">
                  <input
                    value={faq.question}
                    onChange={(e) => updateFaq(index, 'question', e.target.value)}
                    placeholder="Question"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#c48e53]/30 focus:border-[#c48e53]"
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                    placeholder="Answer"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#c48e53]/30 focus:border-[#c48e53] h-20 resize-vertical"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-sm whitespace-nowrap self-start"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addFaq}
            className="mt-3 px-6 py-2 bg-[#c48e53]/20 hover:bg-[#c48e53]/30 text-[#c48e53] font-medium rounded-xl border border-[#c48e53]/30 transition-all duration-200"
          >
            + Add FAQ
          </button>
          {faqs.length > 0 && (
            <p className="text-sm text-green-600 mt-2 font-medium">✅ {faqs.length} FAQ(s) for this blog</p>
          )}
        </div>

        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button 
            type="submit" 
            disabled={loading} 
            className="flex-1 bg-gradient-to-r from-[#c48e53] to-[#a07a3a] hover:from-[#a07a3a] hover:to-[#8f6833] text-white font-bold py-4 px-8 rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {loading ? 'Saving...' : (initialData ? 'Update Blog' : 'Create Blog')}
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-400 text-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}