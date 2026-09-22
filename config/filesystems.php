<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw' => false,
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
        ],

        /*
         * Object storage for anything a user uploads.
         *
         * The container this runs in is replaced on every deploy, so a file
         * written to its own disk is gone by the next one — which is survivable
         * for a product photo and not survivable for the identity document a
         * tailor is verified against.
         *
         * Two disks over one bucket, because the two kinds of file want
         * opposite things: product photos are meant to be fetched by anyone
         * with the link, identity documents are meant to be fetched by nobody
         * without a signed one. Same credentials, different visibility, and a
         * prefix that keeps them from ever sharing a directory.
         *
         * Cloudflare R2 speaks S3, so the driver is 's3'; any S3-compatible
         * provider works by pointing R2_ENDPOINT elsewhere.
         */
        'uploads' => [
            'driver' => 's3',
            'key' => env('R2_ACCESS_KEY_ID'),
            'secret' => env('R2_SECRET_ACCESS_KEY'),
            'region' => env('R2_REGION', 'auto'),
            'bucket' => env('R2_BUCKET'),
            // The public hostname the bucket is served on. Without it the app
            // would hand out signed, expiring links for ordinary product photos.
            'url' => env('R2_PUBLIC_URL'),
            'endpoint' => env('R2_ENDPOINT'),
            'use_path_style_endpoint' => true,
            'visibility' => 'public',
            'throw' => false,
        ],

        'documents' => [
            'driver' => 's3',
            'key' => env('R2_ACCESS_KEY_ID'),
            'secret' => env('R2_SECRET_ACCESS_KEY'),
            'region' => env('R2_REGION', 'auto'),
            'bucket' => env('R2_BUCKET'),
            'root' => 'private',
            'endpoint' => env('R2_ENDPOINT'),
            'use_path_style_endpoint' => true,
            'visibility' => 'private',
            'throw' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Where uploads actually go
    |--------------------------------------------------------------------------
    |
    | Object storage when it is configured, the local disks when it is not, so
    | a machine with no bucket — a laptop, a test run — behaves exactly as it
    | did before. Code asks for these names rather than naming a disk, so the
    | choice is made once, here.
    |
    */

    'uploads_disk' => env('R2_BUCKET') ? 'uploads' : 'public',

    'documents_disk' => env('R2_BUCKET') ? 'documents' : 'local',

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
