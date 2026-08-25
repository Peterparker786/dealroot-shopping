module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.end(JSON.stringify([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.dealroot.app',
        sha256_cert_fingerprints: [
          '7B:DD:2F:D0:6D:FF:1C:47:33:69:48:9B:0D:B7:ED:AA:72:A7:BE:BE:64:32:27:CB:A1:44:4A:C5:F6:EC:84:13'
        ]
      }
    }
  ]));
};
