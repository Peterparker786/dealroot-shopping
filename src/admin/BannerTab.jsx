import { useEffect, useState } from "react";

export default function BannerTab({
  apiUrl,
  token,
  showToast,
}) {
  const [banners, setBanners] = useState([]);

  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    couponCode: "",
    buttonText: "Shop Now",
    buttonLink: "/products",
    image: "",
    active: true,
  });

  const [editingId, setEditingId] = useState("");
  const [uploading, setUploading] = useState(false);

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
      const data = await request(`${apiUrl}/api/banners`);
      setBanners(data.banners || []);
    } catch (err) {
      showToast(err.message);
    }
  };

  useEffect(() => {
    loadBanners();
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