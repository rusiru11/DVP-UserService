module.exports = {
    "DB": {
        "Type":"SYS_DATABASE_TYPE",
        "User":"SYS_DATABASE_POSTGRES_USER",
        "Password":"SYS_DATABASE_POSTGRES_PASSWORD",
        "Port":"SYS_SQL_PORT",
        "Host":"SYS_DATABASE_HOST",
        "Database":"SYS_DATABASE_POSTGRES_USER"
    },


    "Redis":
    {
        "ip": "SYS_REDIS_HOST",
        "port": "SYS_REDIS_PORT",
        "user": "SYS_REDIS_USER",
        "password": "SYS_REDIS_PASSWORD"

    },

    "Security":
    {
        "ip": "SYS_REDIS_HOST",
        "port": "SYS_REDIS_PORT",
        "user": "SYS_REDIS_USER",
        "password": "SYS_REDIS_PASSWORD"

    },

    "Mongo":
    {
        "ip":"SYS_MONGO_HOST",
        "port":"SYS_MONGO_PORT",
        "dbname":"SYS_MONGO_DB",
        "password":"SYS_MONGO_PASSWORD",
        "user":"SYS_MONGO_USER"
    },


    "auth":{

        // OAuth 2.0
        FACEBOOK_SECRET: 'FACEBOOK_CLIENT_SECRET',
        FOURSQUARE_SECRET: 'FOURSQUARE_CLIENT_SECRET',
        GOOGLE_SECRET: 'GOOGLE_CLIENT_SECRET',
        //
        GITHUB_SECRET: 'GITHUB_CLIENT_SECRET',
        INSTAGRAM_SECRET: 'INSTAGRAM_CLIENT_SECRET',
        LINKEDIN_SECRET: 'INKEDIN_CLIENT_SECRET',
        TWITCH_SECRET: 'TWITCH_CLIENT_SECRET',
        WINDOWS_LIVE_SECRET: 'MICROSOFT_CLIENT_SECRET',
        YAHOO_SECRET: 'YAHOO_CLIENT_SECRET',
        BITBUCKET_SECRET:  'BITBUCKET_CLIENT_SECRET',
        SPOTIFY_SECRET: 'SPOTIFY_CLIENT_SECRET',

        // OAuth 1.0
        TWITTER_KEY: 'TWITTER_CLIENT_KEY',
        TWITTER_SECRET: 'TWITTER_CLIENT_SECRET',

        login_verification: 'LOGIN_VERIFICATION_REQUIRE',

        ui_host: 'SYS_APP_UI_HOST'

    },


    "Host":
    {
        "vdomain": "LB_FRONTEND",
        "domain": "HOST_NAME",
        "port": "HOST_USERSERVICE_PORT",
        "version": "HOST_VERSION"
    },

    "LBServer" : {

        "ip": "LB_FRONTEND",
        "port": "LB_PORT"

    },
    "Services" : {
        "accessToken": "HOST_TOKEN",
        "resourceServiceHost": "SYS_RESOURCESERVICE_HOST",
        "resourceServicePort": "SYS_RESOURCESERVICE_PORT",
        "resourceServiceVersion": "SYS_RESOURCESERVICE_VERSION",
        "sipuserendpointserviceHost": "SYS_SIPUSERENDPOINTSERVICE_HOST",
        "sipuserendpointservicePort": "SYS_SIPUSERENDPOINTSERVICE_PORT",
        "sipuserendpointserviceVersion": "SYS_SIPUSERENDPOINTSERVICE_VERSION",
        "clusterconfigserviceHost": "SYS_CLUSTERCONFIG_HOST",
        "clusterconfigservicePort": "SYS_CLUSTERCONFIG_PORT",
        "clusterconfigserviceVersion": "SYS_CLUSTERCONFIG_VERSION"
    }
};

//NODE_CONFIG_DIR
