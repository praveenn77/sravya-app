import React, { useState, ChangeEvent, useEffect } from 'react';
import { CameraIcon, TrashIcon } from '@heroicons/react/24/outline';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import disposableLogo from './assets/disposable.png';

const supabase = createClient('https://hsthleirlcgzwtszcxdc.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdGhsZWlybGNnend0c3pjeGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxMzMxOTMsImV4cCI6MjA1MjcwOTE5M30.VFtQy33T1hoT0TrVoLzW7D5fMlZ-j3dqVQ1ZWQEfm-k')
const uuid = uuidv4();

interface FormData {
  name: string;
  email: string;
  images: File[];
}

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 flex-col">
      <div className="max-w-md w-full space-y-8 bg-white rounded-xl shadow-lg p-8">
        <div className="text-center space-y-2">
          <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
            <div className="text-2xl">Welcome to</div>
            <div className="text-4xl mt-2 font-extrabold">Sravya & Sriram's</div>
            <div className="text-2xl mt-2">Reception</div>
          </h2>
          <p className="mt-4 text-sm text-gray-600">Select the app you would like to use</p>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <a
              href="https://disposable.app/camera/20345/capture/2b09bf9c0ea" // Replace with your desired link
              rel="noopener noreferrer"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <img src={disposableLogo} alt="Disposable Camera Logo" className="h-5 w-5 mr-2" />
              Disposable Camera
            </a>
            <p className="text-sm text-gray-500 text-center px-4">
            Capture the event from your unique perspective and share your photos with us! (No installation needed).
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => navigate('/upload')}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <CameraIcon className="h-5 w-5 mr-2" />
              Submit Selfies
            </button>
            <p className="text-sm text-gray-500 text-center px-4">
            Share your selfies and email address with us, and we’ll send you the photos captured of you during the event! (In house app)
            </p>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center text-sm text-gray-500">
        Made with love by <a href="https://www.linkedin.com/in/np77/" target="_blank" className='underline'>Praveen (Sravya's little bro)</a>
      </div>
    </div>
  );
};

function SelfieUpload() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    images: [],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<'form' | 'loading' | 'success'>(() => {
    // Check localStorage on initial load
    const savedState = localStorage.getItem('submissionState');
    return savedState === 'success' ? 'success' : 'form';
  });

  // Update localStorage whenever formState changes
  useEffect(() => {
    if (formState === 'success') {
      localStorage.setItem('submissionState', 'success');
    }
  }, [formState]);

  const resetForm = () => {
    localStorage.removeItem('submissionState');
    setFormState('form');
    setFormData({
      name: '',
      email: '',
      images: [],
    });
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if(!formData.images) return;
      const newImages = [...formData.images];
      newImages[index] = file;
      setFormData((prev) => ({
        ...prev,
        images: newImages,
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        const previewImg = document.getElementById(`preview-${index}`) as HTMLImageElement;
        if (previewImg) {
          previewImg.src = reader.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  async function uploadFile(file: File, index: number) {
    try {
      const fileName = `${uuid}-${index + 1}.jpg`;
      const { data, error } = await supabase.storage
        .from('selfies')
        .upload(fileName, file, {
          contentType: file.type,
        });
      
      if (error) {
        console.error('Upload error:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  async function insertUserData(name: string, email: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            name,
            email,
            uuid,
          }
        ]);

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Database insert failed:', error);
      throw error;
    }
  }

  const validateImages = () => {
    if (formData.images.filter(img => img).length !== 3) {
      throw new Error('Please select all three images before submitting');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUploading(true);
    setFormState('loading');

    try {
      // Validate all images are selected
      validateImages();

      // Upload all images
      await Promise.all(formData.images.map((file, index) => uploadFile(file, index)));

      // Insert user data and image URLs into the database
      await insertUserData(formData.name, formData.email);

      // Clear form after successful upload
      setFormData({
        name: '',
        email: '',
        images: [],
      });

      setFormState('success');
      // localStorage is updated automatically through useEffect

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process your submission');
      setFormState('form');
    } finally {
      setIsUploading(false);
    }
  };

  const LoadingPage = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="w-16 h-16">
        <svg className="animate-spin w-full h-full text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <p className="text-lg text-gray-600">Processing your submission...</p>
      <p className="text-sm text-gray-500">Please don't close this window</p>
    </div>
  );

  const ThankYouPage = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900">Thank You!</h2>
      <p className="text-center text-gray-600 max-w-sm">
        Your images have been successfully uploaded. We'll process them and send you an email shortly.
      </p>
      <button
        onClick={resetForm}
        className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
      >
        Submit Another
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <CameraIcon className="mx-auto h-12 w-12 text-purple-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Take Selfies</h2>
          <p className="mt-2 text-gray-600">Upload your selfies and receive an email with the photos taken of you during this event. This in an in-house app completely developed by us</p>
        </div>

        {formState === 'loading' && <LoadingPage />}
        {formState === 'success' && <ThankYouPage />}
        {formState === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-purple-500"
              />
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Take Selfies (3 images)
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="relative">
                    <div className="aspect-square w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-500">
                      {formData.images[index] ? (
                        <>
                        <img
                          id={`preview-${index}`}
                          src={URL.createObjectURL(formData.images[index])}
                          alt={`Selfie ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <TrashIcon
                          onClick={() => {
                            const newImages = [...formData.images];
                            newImages[index] = null;
                            setFormData((prev) => ({
                              ...prev,
                              images: newImages,
                            }));
                          }}
                          className="delete-btn"
                        />
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center gap-2">
                          <label className="flex flex-col items-center gap-1 text-sm text-gray-600 hover:text-purple-600 cursor-pointer">
                            <CameraIcon className="h-8 w-8" />
                            <span>Take Photo</span>
                            <input
                              type="file"
                              id={`image-${index}`}
                              accept="image/*"
                              capture
                              onChange={(e) => handleImageChange(e, index)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                isUploading ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : (
                'Upload Images'
              )}
            </button>
          </form>
        )}
      </div>
      <div className="mt-8 text-center text-sm text-gray-500">
        Made with love by <a href="https://www.linkedin.com/in/np77/" target="_blank" className='underline'>Praveen (Sravya's little bro)</a>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<SelfieUpload />} />
      </Routes>
    </Router>
  );
}

export default App;