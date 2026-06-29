import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../lib/api/auth';
import userProfileService from '../lib/api/userProfile';
import visaApplicationsService from '../lib/api/visaApplications';
import adminStatsService from '../lib/api/adminStats';
import adminBlogsService, { AdminBlogListItem } from '../lib/api/adminBlogs';
import VisaApplications from '../components/Dashboard/VisaApplications';
import AdminSiteSettings from '../components/Admin/AdminSiteSettings';
import AdminCountryAccess from '../components/Admin/AdminCountryAccess';
import AdminMembers from '../components/Admin/AdminMembers';
import AdminEmailCenter from '../components/Admin/AdminEmailCenter';
import AdminPromoCodes from '../components/Admin/AdminPromoCodes';
import AdminEvisaFees from '../components/Admin/AdminEvisaFees';
import AdminDbSetupNotice from '../components/Admin/AdminDbSetupNotice';
import { VisaApplication } from '../types/visa';
import { isIncompleteDraft } from '../utils/visaApplicationProgress';

type AdminTab = 'applications' | 'blogs' | 'statistics' | 'settings' | 'countryAccess' | 'members' | 'emails' | 'promoCodes' | 'evisaFees';

interface BlogFormState {
  title: string;
  subtitle: string;
  content: string[];
  author: string;
  country_code: string;
  date?: string;
  read_time?: string;
  image_url: string;
  is_published: boolean;
}

const AdminDashboard: React.FC = () => {
  const [blogs, setBlogs] = useState<AdminBlogListItem[]>([]);
  const [newBlog, setNewBlog] = useState<BlogFormState>({
    title: '',
    subtitle: '',
    content: [''],
    author: '',
    country_code: '',
    image_url: '',
    is_published: false
  });
  const [activeTab, setActiveTab] = useState<AdminTab>('applications');
  const [adminApplications, setAdminApplications] = useState<VisaApplication[]>([]);
  const [applicationFilter, setApplicationFilter] = useState<'all' | 'incomplete' | 'submitted'>('all');
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    totalApplications: 0,
    incompleteApplications: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentBlogId, setCurrentBlogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statsWarning, setStatsWarning] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const filteredApplications = useMemo(() => {
    if (applicationFilter === 'all') return adminApplications;
    if (applicationFilter === 'incomplete') {
      return adminApplications.filter((app) => isIncompleteDraft(app));
    }
    return adminApplications.filter((app) => !isIncompleteDraft(app));
  }, [adminApplications, applicationFilter]);
  
  // Fetch blogs when blogs tab is opened
  useEffect(() => {
    if (activeTab === 'blogs') {
      void fetchBlogs();
    }
  }, [activeTab]);
  
  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { blogs: nextBlogs, error: blogsError } = await adminBlogsService.listBlogs();
      setBlogs(nextBlogs);
      if (blogsError) {
        setError('Could not sync blogs from server. Showing local and built-in posts.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewBlog(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNewBlog(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleContentChange = (index: number, value: string) => {
    const updatedContent = [...newBlog.content];
    updatedContent[index] = value;
    setNewBlog(prev => ({ ...prev, content: updatedContent }));
  };
  
  const addParagraph = () => {
    setNewBlog(prev => ({ ...prev, content: [...prev.content, ''] }));
  };
  
  const removeParagraph = (index: number) => {
    if (newBlog.content.length > 1) {
      const updatedContent = [...newBlog.content];
      updatedContent.splice(index, 1);
      setNewBlog(prev => ({ ...prev, content: updatedContent }));
    }
  };
  
  const saveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const blogData = {
        ...newBlog,
        date: newBlog.date || new Date().toISOString().split('T')[0],
        read_time: newBlog.read_time || `${Math.ceil(newBlog.content.join(' ').length / 1000)} min read`,
      };
      
      const { error: saveError } = await adminBlogsService.saveCustomBlog({
        ...blogData,
        id: isEditing && currentBlogId ? currentBlogId : undefined,
      });
      
      if (saveError) throw saveError;
      setSuccessMessage(isEditing ? 'Blog updated successfully!' : 'Blog created successfully!');
      
      // Reset form and refresh blogs
      setNewBlog({
        title: '',
        subtitle: '',
        content: [''],
        author: '',
        country_code: '',
        image_url: '',
        is_published: false
      });
      setIsEditing(false);
      setCurrentBlogId(null);
      fetchBlogs();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error saving blog:', error);
      setError('Failed to save blog. Please check your input and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const editBlog = (blog: AdminBlogListItem) => {
    if (blog.source === 'builtin') {
      setError('Built-in blog posts cannot be edited here. Unpublish or add a custom post instead.');
      return;
    }

    setNewBlog({
      title: blog.title,
      subtitle: blog.subtitle,
      content: blog.content,
      author: blog.author,
      country_code: blog.country_code,
      date: blog.date,
      read_time: blog.read_time,
      image_url: blog.image_url,
      is_published: blog.is_published
    });
    setIsEditing(true);
    setCurrentBlogId(blog.id);
  };
  
  const deleteBlog = async (blog: AdminBlogListItem) => {
    if (blog.source === 'builtin') {
      setError('Built-in posts cannot be deleted. Use Unpublish to hide them.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this blog?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      const { error: deleteError } = await adminBlogsService.deleteCustomBlog(blog.id);
        
      if (deleteError) {
        throw deleteError;
      }
      
      setSuccessMessage('Blog deleted successfully!');
      fetchBlogs();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error deleting blog:', error);
      setError('Failed to delete blog. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const togglePublishStatus = async (blog: AdminBlogListItem) => {
    try {
      setIsLoading(true);
      const nextPublished = !blog.is_published;

      const { error: toggleError } =
        blog.source === 'builtin'
          ? await adminBlogsService.setBuiltinPublished(blog.id, nextPublished)
          : await adminBlogsService.saveCustomBlog({ ...blog, is_published: nextPublished });

      if (toggleError) {
        throw toggleError;
      }
      
      setSuccessMessage(`Blog ${blog.is_published ? 'unpublished' : 'published'} successfully!`);
      fetchBlogs();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error toggling publish status:', error);
      setError('Failed to update publish status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setNewBlog({
      title: '',
      subtitle: '',
      content: [''],
      author: '',
      country_code: '',
      image_url: '',
      is_published: false
    });
    setIsEditing(false);
    setCurrentBlogId(null);
  };
  
  useEffect(() => {
    const checkAdmin = async () => {
      const { session } = await authService.getSession();

      if (!session) {
        navigate('/admin/login');
        return;
      }

      const { profile } = await userProfileService.getCurrentUserProfile();
      const isAdmin = profile?.subscription_tier === 'admin';

      if (!isAdmin) {
        navigate('/dashboard');
        return;
      }

      const { applications } = await visaApplicationsService.getAllApplicationsForAdmin();
      setAdminApplications(applications ?? []);

      const { stats, error: statsError } = await adminStatsService.getStats();
      setUserStats(stats);

      if (statsError) {
        setStatsWarning(
          'Statistics may be incomplete until admin database policies are applied. Run the latest Supabase migration or set SUPABASE_SERVICE_ROLE_KEY on Netlify.'
        );
      }
    };

    void checkAdmin();
  }, [navigate]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-teal-700 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Hydra Admin</h1>
          <nav>
            <Link to="/dashboard" className="text-white hover:text-teal-200 ml-4">
              Back to Dashboard
            </Link>
          </nav>
        </div>
      </header>
      
      <div className="container mx-auto p-4">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex">
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'applications' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-teal-500'}`}
              onClick={() => setActiveTab('applications')}
            >
              Applications
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'blogs' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-teal-500'}`}
              onClick={() => setActiveTab('blogs')}
            >
              Blogs
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'statistics' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-teal-500'}`}
              onClick={() => setActiveTab('statistics')}
            >
              Statistics
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'settings' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-teal-500'}`}
              onClick={() => setActiveTab('settings')}
            >
              Site Settings
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'members' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-teal-500'}`}
              onClick={() => setActiveTab('members')}
            >
              Members
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'emails' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-teal-500'}`}
              onClick={() => setActiveTab('emails')}
            >
              Email Center
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'countryAccess' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-teal-500'}`}
              onClick={() => setActiveTab('countryAccess')}
            >
              Country Access
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'promoCodes' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-teal-500'}`}
              onClick={() => setActiveTab('promoCodes')}
            >
              Promo Codes
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'evisaFees' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-500 hover:text-teal-500'}`}
              onClick={() => setActiveTab('evisaFees')}
            >
              eVisa Fees
            </button>
          </div>
        </div>
        
        {/* Success and error messages */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}
        
        {error && activeTab === 'blogs' && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {activeTab === 'applications' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Visa Applications</h2>
            <p className="mb-4 text-sm text-gray-600">
              Review submitted and incomplete applications across all user accounts.
            </p>
            <div className="mb-6 flex flex-wrap gap-2">
              {(['all', 'incomplete', 'submitted'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setApplicationFilter(filter)}
                  className={`rounded-full px-4 py-1.5 text-sm ${
                    applicationFilter === filter
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'all'
                    ? `All (${adminApplications.length})`
                    : filter === 'incomplete'
                      ? `Incomplete (${adminApplications.filter((app) => isIncompleteDraft(app)).length})`
                      : `Submitted (${adminApplications.filter((app) => !isIncompleteDraft(app)).length})`}
                </button>
              ))}
            </div>
            <VisaApplications
              applications={filteredApplications}
              isAdmin
              onRefresh={async () => {
                const { applications } = await visaApplicationsService.getAllApplicationsForAdmin();
                setAdminApplications(applications ?? []);
                const { stats } = await adminStatsService.getStats();
                setUserStats(stats);
              }}
            />
          </div>
        )}

        {activeTab === 'blogs' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Blog Form */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">{isEditing ? 'Edit Blog' : 'Create New Blog'}</h2>
                
                <form onSubmit={saveBlog}>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={newBlog.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      name="subtitle"
                      value={newBlog.subtitle}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Author
                    </label>
                    <input
                      type="text"
                      name="author"
                      value={newBlog.author}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Country Code (e.g., jp, us, th)
                    </label>
                    <input
                      type="text"
                      name="country_code"
                      value={newBlog.country_code}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Date (Optional)
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={newBlog.date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Read Time (Optional)
                    </label>
                    <input
                      type="text"
                      name="read_time"
                      value={newBlog.read_time}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., 5 min read"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Image URL
                    </label>
                    <input
                      type="url"
                      name="image_url"
                      value={newBlog.image_url}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Content Paragraphs
                    </label>
                    {newBlog.content.map((paragraph, index) => (
                      <div key={index} className="mb-2 flex">
                        <textarea
                          value={paragraph}
                          onChange={(e) => handleContentChange(index, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          rows={3}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => removeParagraph(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                          disabled={newBlog.content.length <= 1}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addParagraph}
                      className="text-teal-600 hover:text-teal-800 text-sm mt-2 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Paragraph
                    </button>
                  </div>
                  
                  <div className="mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_published"
                        checked={newBlog.is_published}
                        onChange={handleCheckboxChange}
                        className="h-4 w-4 text-teal-600"
                      />
                      <span className="ml-2 text-gray-700">Publish immediately</span>
                    </label>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-2 px-4 bg-teal-600 text-white rounded-md hover:bg-teal-700"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : isEditing ? 'Update Blog' : 'Save Blog'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Blog List */}
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Blog Posts</h2>
                
                {isLoading && !blogs.length ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Loading blogs...</p>
                  </div>
                ) : blogs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No blogs found. Create your first blog post!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Country
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Source
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {blogs.map((blog) => (
                          <tr key={blog.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{blog.title}</div>
                              <div className="text-sm text-gray-500">{blog.subtitle.substring(0, 30)}...</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 uppercase">{blog.country_code}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs capitalize text-gray-700">
                                {blog.source}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                blog.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {blog.is_published ? 'Published' : 'Draft'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {blog.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => togglePublishStatus(blog)}
                                  className={`${
                                    blog.is_published ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'
                                  }`}
                                >
                                  {blog.is_published ? 'Unpublish' : 'Publish'}
                                </button>
                                {blog.source === 'custom' && (
                                  <>
                                    <button
                                      onClick={() => editBlog(blog)}
                                      className="text-indigo-600 hover:text-indigo-900"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => deleteBlog(blog)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                                <Link
                                  to={`/blogs/${blog.country_code}`}
                                  target="_blank"
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'statistics' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Website Statistics</h2>

            {statsWarning && (
              <div className="mb-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
                {statsWarning}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-1">Total Users</h3>
                <p className="text-3xl font-bold">{userStats.totalUsers}</p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-1">Premium Users</h3>
                <p className="text-3xl font-bold">{userStats.premiumUsers}</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-1">Visa Applications</h3>
                <p className="text-3xl font-bold">{userStats.totalApplications}</p>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-1">Incomplete Applications</h3>
                <p className="text-3xl font-bold">{userStats.incompleteApplications}</p>
              </div>
            </div>
            
            <div className="text-center py-4 text-gray-500">
              Use the Applications tab to review incomplete drafts and update submitted application status.
            </div>
          </div>
        )}

        {activeTab === 'settings' && <AdminSiteSettings />}

        {activeTab === 'countryAccess' && <AdminCountryAccess />}

        {activeTab === 'members' && <AdminMembers />}

        {activeTab === 'emails' && <AdminEmailCenter />}

        {activeTab === 'promoCodes' && (
          <>
            <AdminDbSetupNotice />
            <AdminPromoCodes />
          </>
        )}
        {activeTab === 'evisaFees' && (
          <>
            <AdminDbSetupNotice />
            <AdminEvisaFees />
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 