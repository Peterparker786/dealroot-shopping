import { useEffect } from "react";

export default function BannerTab({
  apiUrl,
  token,
  showToast,
}) {
  const request = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message);
    }

    return data;
  };

  const loadBanners = async () => {
    try {
      await request(`${apiUrl}/api/banners`);
    } catch (err) {
      showToast(err.message);
    }
  };

  useEffect(() => {
    loadBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="admin-form-card">
      <div className="admin-section-title">
        <div>
          <p>MARKETING</p>
          <h2>Offer Banner Management</h2>
        </div>
      </div>
    </div>
  );
}